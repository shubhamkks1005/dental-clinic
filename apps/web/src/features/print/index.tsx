import { Route, Routes } from "react-router";
import { NotFound } from "../../ui/PageMessage";
import { PrintDayListScreen } from "./PrintDayListScreen";
import { PrintPrescriptionScreen } from "./PrintPrescriptionScreen";
import { PrintSampleScreen } from "./PrintSampleScreen";

// /app/print/*: print screens open without the app frame (menu, top bar, tabs).
export function PrintRoutes() {
  return (
    <Routes>
      <Route path="sample" element={<PrintSampleScreen />} />
      <Route path="day" element={<PrintDayListScreen />} />
      <Route path="prescription/:id" element={<PrintPrescriptionScreen />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
