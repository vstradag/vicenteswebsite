"use client";

import dynamic from "next/dynamic";

const DemoClient = dynamic(() => import("./DemoClient").then((m) => m.DemoClient), {
  ssr: false,
});

export function DemoLoader() {
  return <DemoClient />;
}
