"use client";

import {
  createChart,
  IChartApi,
  ISeriesApi,
  LineSeries,
  TickMarkFormatter,
  UTCTimestamp,
} from "lightweight-charts";
import { useEffect, useRef, useState } from "react";

export default function Home() {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<unknown | null>(null);
  const [priceScaleMode, setPriceScaleMode] = useState("0");
  const [range, setRange] = useState("11");
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

    for (const [playerName, data1] of Object.entries(datasets)
      .sort(([, a], [, b]) => b.at(-1)!.value - a.at(-1)!.value)
      .filter((_, ix) => rangeAsNumber === 11 || ix < rangeAsNumber)) {
      const lineSeries = chart.addSeries(LineSeries);
      allSeries.push(lineSeries);
      lineSeries.setData(data1);
      lineSeries.applyOptions({
        title: playerName,
        color: ["blue", "green", "red", "orange", "purple", "pink"][
          Math.floor(Math.random() * 7)
        ],
      });
    }
    chart.timeScale().fitContent();

    chart.applyOptions({
      rightPriceScale: {
        mode: priceScaleModeAsNumber,
      },
    });

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
        timeVisible: true, //(time: Time, tickMarkType: TickMarkType, locale: string) => string | null
        tickMarkFormatter: ((time, tickMarkType, locale) => {
          return new Date((time.valueOf() as number) * 1000).toLocaleString(
            locale
          );
        }) as TickMarkFormatter,
        // minBarSpacing: 140,
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
          <span
            className="whitespace-nowrap cursor-pointer text-orange-500"
            onClick={() => setRange(range === "11" ? "2" : "" + (+range + 1))}
          >
            {range !== "11" ? (
              <>Show players with top {range} trophy points</>
            ) : (
              <>Show all players</>
            )}
          </span>
          <span
            className="whitespace-nowrap cursor-pointer text-green-500"
            onClick={() => setPriceScaleMode((x) => "" + ((+x + 1) % 4))}
            title={
              priceScaleModeAsNumber === 0
                ? "Normal (Price scale shows prices. Price range changes linearly.)"
                : priceScaleModeAsNumber === 1
                ? "Logarithmic (Price scale shows prices. Price range changes logarithmically.)"
                : priceScaleModeAsNumber === 2
                ? "Percentage (Price scale shows percentage values according the first visible value of the price scale. * The first visible value is 0% in this mode.)"
                : "Indexed to 100 (The same as percentage mode, but the first value is moved to 100.)"
            }
          >
            Price Scale Mode:{" "}
            {priceScaleModeAsNumber === 0
              ? "Normal"
              : priceScaleModeAsNumber === 1
              ? "Logarithmic"
              : priceScaleModeAsNumber === 2
              ? "Percentage"
              : "Indexed to 100"}
          </span>
          <span className="whitespace-nowrap text-gray-500">
            {"<"}== click me! (send me thoughts on this on discord!)
          </span>
        </div>
      </div>
      <div ref={chartContainerRef} id="apple" className="w-full flex-1"></div>
    </main>
  );
}
