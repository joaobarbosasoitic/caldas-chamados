"use client";

import dynamic from "next/dynamic";

const Loading = () => <div className="h-72 animate-pulse rounded-lg bg-brand-50" />;

export const MapPicker = dynamic(() => import("./MapPickerInner"), { ssr: false, loading: Loading });
export const TicketsMap = dynamic(() => import("./TicketsMapInner"), { ssr: false, loading: Loading });
export type { MapTicket } from "./TicketsMapInner";
