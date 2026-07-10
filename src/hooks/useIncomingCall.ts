import { useEffect, useState } from "react";
import { sipClient } from "../sip/SipClient";

export type IncomingInfo = { id: string; from: string; displayName?: string } | null;

export function useIncomingCall(): IncomingInfo {
  const [info, setInfo] = useState<IncomingInfo>(null);
  useEffect(() => {
    const onIn = (i: any) => setInfo(i);
    const clear = () => setInfo(null);
    sipClient.on("incoming", onIn);
    sipClient.on("accepted", clear);
    sipClient.on("ended", clear);
    sipClient.on("failed", clear);
    return () => {
      sipClient.off("incoming", onIn);
      sipClient.off("accepted", clear);
      sipClient.off("ended", clear);
      sipClient.off("failed", clear);
    };
  }, []);
  return info;
}
