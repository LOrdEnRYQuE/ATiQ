"use client";

import { useEffect } from "react";
import { selectConfigLoading, useConfigStore } from "@/lib/configStore";

export function ConfigInitializer() {
  const initialize = useConfigStore((s) => s.initialize);
  const loading = useConfigStore(selectConfigLoading);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  // Render nothing; could add a tiny spinner if needed
  return loading ? null : null;
}
