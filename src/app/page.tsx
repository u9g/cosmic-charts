"use client";

import {
  createChart,
  IChartApi,
  ISeriesApi,
  LineSeries,
  UTCTimestamp,
} from "lightweight-charts";
import { useEffect, useRef, useState } from "react";
import { PartialPriceLine } from "./plugins/partial-price-line";

export default function Home() {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<unknown | null>(null);
  const [priceScaleMode, setPriceScaleMode] = useState("0");
  const [range, setRange] = useState("3");
  const rangeAsNumber = +range; // 11 = all
  const priceScaleModeAsNumber = +priceScaleMode;
  const chartRef = useRef<IChartApi>(null);

  useEffect(() => {
    async function getData() {
      const results = await fetch(
        "https://shiny-water-0f27.aibotted849.workers.dev/"
      ).then((res) => res.json());

      return results;
    }

    getData().then((newData) => setData(newData));
  }, []);

  useEffect(() => {
    const { current: chart } = chartRef;
    if (!chart || !data) return;

    const datasets: Record<string, { time: UTCTimestamp; value: number }[]> =
      {};

    for (const { collection_time, data: dat } of data as {
      collection_time: UTCTimestamp;
      data: string;
    }[]) {
      for (const { playerName, trophyPoints } of JSON.parse(dat).isTop) {
        if (!(playerName in datasets)) {
          datasets[playerName] = [];
        }

        datasets[playerName].push({
          time: collection_time,
          value: trophyPoints,
        });
      }
    }

    const allSeries: ISeriesApi<"Line">[] = [];

    let i = 0;

    for (const [playerName, data1] of Object.entries(datasets)
      .sort(([, a], [, b]) => b.at(-1)!.value - a.at(-1)!.value)
      .filter((_, ix) => rangeAsNumber === 11 || ix < rangeAsNumber)) {
      const lineSeries = chart.addSeries(LineSeries);
      lineSeries.attachPrimitive(new PartialPriceLine());
      allSeries.push(lineSeries);
      lineSeries.setData(data1);
      lineSeries.applyOptions({
        title: playerName,
        color: [
          "#3B82F6",
          "#8D74FC",
          "#CF59F1",
          "#FF2FC1",
          "#FF5D6E",
          "#FF9D3E",
          "#E2C11F",
          "#AEDD17",
          "#3BF652",
        ][Math.floor(i++ % 9)],
      });
    }
    chart.timeScale().fitContent();

    chart.applyOptions({
      rightPriceScale: {
        mode: priceScaleModeAsNumber,
      },
    });

    chart.timeScale().fitContent();
    // show a little of the PartialPriceLine by having the screen a bit off center
    // console.log(
    //   chart.timeScale().timeToIndex(chart.timeScale().getVisibleRange()!.to)!
    // );
    // chart.timeScale().scrollToPosition(20, false);

    return () => {
      allSeries.forEach((series) => {
        chart.removeSeries(series);
      });
    };
  }, [data, rangeAsNumber, priceScaleModeAsNumber]);

  useEffect(() => {
    const chart = createChart("apple", {
      width: chartContainerRef.current!.clientWidth,
      height: chartContainerRef.current!.clientHeight,
      timeScale: {
        secondsVisible: false,
        timeVisible: true,
        tickMarkFormatter: (time: number) => {
          const date = new Date(time * 1000);
          return date.toLocaleString(undefined, {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          });
        },
      },
    });

    const handleResize = () => {
      chart.applyOptions({
        width: chartContainerRef.current!.clientWidth,
        height: chartContainerRef.current!.clientHeight,
      });
    };

    window.addEventListener("resize", handleResize);

    chartRef.current = chart;
    return () => {
      window.removeEventListener("resize", handleResize);

      chart.remove();
      chartRef.current = null;
    };
  }, [chartContainerRef]);

  return (
    <main className="flex flex-col items-center justify-center min-h-[100dvh] w-full">
      <div className="w-full overflow-x-auto">
        <div className="flex flex-row items-center justify-center gap-4 my-2 min-w-max">
          <p className="whitespace-nowrap text-blue-500">
            Trophy Points by @u9g
          </p>
          <div className="flex items-center gap-2">
            <label
              htmlFor="playerCount"
              className="text-orange-500 whitespace-nowrap"
            >
              Show top:
            </label>
            <select
              id="playerCount"
              value={range}
              onChange={(e) => setRange(e.target.value)}
              className="appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23F97316%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.4-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:0.7em] bg-no-repeat bg-[right_0.5em_center] bg-transparent border border-orange-500 rounded py-1 px-2 text-orange-500 cursor-pointer hover:bg-orange-500/10 transition-colors"
            >
              <option value="11">All players</option>
              {[2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                <option key={num} value={num}>
                  Top {num} players
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label
              htmlFor="priceScaleMode"
              className="text-green-500 whitespace-nowrap"
            >
              Price Scale Mode:
            </label>
            <select
              id="priceScaleMode"
              value={priceScaleMode}
              onChange={(e) => setPriceScaleMode(e.target.value)}
              className="appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2322C55E%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.4-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:0.7em] bg-no-repeat bg-[right_0.5em_center] bg-transparent border border-green-500 rounded py-1 px-2 text-green-500 cursor-pointer hover:bg-green-500/10 transition-colors"
            >
              <option value="0">Normal</option>
              <option value="1">Logarithmic</option>
              <option value="2">Percentage</option>
              <option value="3">Indexed to 100</option>
            </select>
          </div>
          <span className="whitespace-nowrap text-gray-500">
            (send me thoughts on this on discord!)
          </span>
        </div>
      </div>
      <div ref={chartContainerRef} id="apple" className="w-full flex-1"></div>
    </main>
  );
}
