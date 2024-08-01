import React from "react";
import { Scatter } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import { useLocation } from "react-router-dom";
import {
  errorBarPlugin,
  customXYLinePlugin,
  customGridLinePlugin,
} from "../../lib/plugins/Plugins";
import {
  BarWithErrorBar,
  BarWithErrorBarsChart,
  BarWithErrorBarsController,
} from "chartjs-chart-error-bars";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  BarWithErrorBarsChart,
  BarWithErrorBar,
  BarWithErrorBarsController,
  Tooltip,
  Legend
);

// Custom Plugin Register 부분
ChartJS.register(errorBarPlugin, customXYLinePlugin, customGridLinePlugin);

function calculateBarDataWithErrors(savedData, stdDevs) {
  const groupedData = savedData.reduce((acc, { x, y }) => {
    if (!acc[x]) {
      acc[x] = [];
    }
    acc[x].push(y);
    return acc;
  }, {});

  return Object.entries(groupedData).map(([x, yValues], index) => {
    const mean = yValues.reduce((sum, y) => sum + y, 0) / yValues.length;
    const stdDevValue = stdDevs[index];
    return {
      x: parseInt(x, 10),
      y: mean,
      yMin: mean - stdDevValue,
      yMax: mean + stdDevValue,
    };
  });
}

// 표본 표준편차
function calculateStandardDeviation(datas) {
  const groupedData = datas.reduce((acc, { x, y }) => {
    if (!acc[x]) {
      acc[x] = [];
    }
    acc[x].push(y);
    return acc;
  }, {});

  const arrayData = Object.values(groupedData);

  function stdDev(arr) {
    if (arr.length === 0) return 0;
    const mean = arr.reduce((acc, val) => acc + val, 0) / arr.length;
    const variance =
      arr.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) /
      (arr.length - 1);
    return Math.sqrt(variance);
  }

  const stdDevs = arrayData.map((innerArray) => stdDev(innerArray));

  return stdDevs;
}

// 커스텀 플러그인 정의
const customBarSpacingPlugin = {
  id: 'customBarSpacing',
  beforeDraw(chart) {
    const { ctx, chartArea, data } = chart;
    const meta = chart.getDatasetMeta(1); // 막대 데이터셋

    // 막대 간 간격 조절을 위한 간격 값
    const spacing = 5;
    const barWidth = meta.data[0].width;

    meta.data.forEach((bar, index) => {
      const x = bar.x;
      const y = bar.y;
      const width = barWidth;
      const height = bar.height;

      // 간격에 따라 막대 위치 조정
      const newWidth = width - spacing;
      const offset = (width - newWidth) / 2;

      ctx.clearRect(x - width / 2, y - height / 2, width, height);
      ctx.fillStyle = data.datasets[1].backgroundColor[index];
      ctx.fillRect(x - offset, y - height / 2, newWidth, height);
    });
  }
};

export default function ScatterWithBars() {
  const location = useLocation();
  const { savedData } = location.state || {};
  const scatterData = savedData;
  const columnsLabel = location.state.columns;
  const Xtitle = location.state.Xtitle;
  const Ytitle = location.state.Ytitle;
  const StandardDeviationWithSavedData = calculateStandardDeviation(savedData);
  // 에러가 적용된 barYData 생성
  const barYData = calculateBarDataWithErrors(
    savedData,
    StandardDeviationWithSavedData
  );

  const barColors = ["#8998fa", "#F59F91", "#A9E19B", "#FDB461"];
  const scatterColors = ["#1532F5", "#ED4124", "#54C339", "#f19224"];
  // scatterData의 각 점에 대해, 바의 색상과 동일하게 설정
  const scatterDataWithColors = scatterData.map((point) => {
    const barIndex = barYData.findIndex((bar) => bar.x === point.x);
    return {
      ...point,
      backgroundColor: scatterColors[barIndex % barColors.length], // 바의 색상과 동일하게 설정
    };
  });

  const data = {
    datasets: [
      {
        type: "scatter",
        label: "Scatter Dataset",
        data: scatterDataWithColors,
        pointRadius: 10,
        // 각 점의 색상을 개별적으로 설정
        pointBackgroundColor: scatterDataWithColors.map(point => point.backgroundColor),
      },
      {
        type: "barWithErrorBars",
        label: "Bar Dataset",
        data: barYData,

        backgroundColor: barColors,
        borderColor: scatterColors,
        borderWidth: 10,
        barPercentage: 0.6,
        categoryPercentage: 1,
        errorBarWhiskerLineWidth: 4,
        errorBarLineWidth: 4;
        errorBarWhiskerRatio: 0.45,
        errorBarColor: scatterColors,
        errorBarWhiskerColor: scatterColors
      },
    ],
  };


  const options = {
    maintainAspectRatio: false,
    plugins: {
      customBarSpacing: true 
    },
    scales: {
      x: {
        type: "linear",
        position: "bottom",
        grid: {
          display: false,
        },
        ticks: {
          stepSize: 1,
          autoSkip: false,
          maxRotation: 45,
          minRotation: 45,
          font: {
            weight: "bold",
            size: 20,
          },
          color: "black",
          callback: function (value) {
            return columnsLabel[value] || "";
          },
          padding: 18,
        },
        title: {
          display: true,
          text: Xtitle,
          align: "middle",
          color: "black",
          font: {
            size: 30,
            family: "Consolas",
            weight: "bold",
          },
        },
      },
      y: {
        grid: {
          display: false,
        },
        ticks: {
          stepSize: 2,
          font: {
            color: "black",
            weight: "bold",
            size: 20,
          },
          color: "black",
          padding: 15,
        },
        title: {
          display: true,
          text: Ytitle,
          align: "middle",
          color: "black",
          font: {
            size: 30,
            family: "Consolas",
            weight: "bold",
          },
        },
      },
    },
  };

  return <Scatter data={data} options={options} />;
}
