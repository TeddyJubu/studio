"use client";

import Cal, { getCalApi } from "@calcom/embed-react";
import { useEffect } from "react";

export function CalComDisplay() {
    useEffect(() => {
        (async function () {
          const cal = await getCalApi();
          cal("ui", {"styles":{"branding":{"brandColor":"#000000"}},"hideEventTypeDetails":false,"layout":"month_view"});
        })();
      }, []);
    return <Cal
        calLink="pro/intro"
        style={{width:"100%",height:"100%",overflow:"scroll"}}
        config={{layout: 'month_view'}}
    />;
};
