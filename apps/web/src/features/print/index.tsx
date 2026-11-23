import { Route, Routes } from "react-router";
import { NotFound } from "../../ui/PageMessage";
import { PrintBlankFormsScreen } from "./PrintBlankFormsScreen";
import { PrintCertificateScreen } from "./PrintCertificateScreen";
import { PrintConsentScreen } from "./PrintConsentScreen";
import { PrintBillScreen } from "./PrintBillScreen";
import { PrintDayCloseScreen } from "./PrintDayCloseScreen";
import { PrintDayListScreen } from "./PrintDayListScreen";
import { PrintEstimateScreen } from "./PrintEstimateScreen";
import { PrintPrescriptionScreen } from "./PrintPrescriptionScreen";
import { PrintReceiptScreen } from "./PrintReceiptScreen";
import { PrintSampleScreen } from "./PrintSampleScreen";
import { PrintMonthlyReportScreen } from "./PrintMonthlyReportScreen";
import { PrintStatementScreen } from "./PrintStatementScreen";
import { PrintHistorySummaryScreen } from "./PrintHistorySummaryScreen";

// /app/print/*: print screens open without the app frame (menu, top bar, tabs).
export function PrintRoutes() {
  return (
    <Routes>
      <Route path="sample" element={<PrintSampleScreen />} />
      <Route path="day" element={<PrintDayListScreen />} />
      <Route path="day-close" element={<PrintDayCloseScreen />} />
      <Route path="monthly-report" element={<PrintMonthlyReportScreen />} />
      <Route path="bill/:id" element={<PrintBillScreen />} />
      <Route path="receipt/:id" element={<PrintReceiptScreen />} />
      <Route path="statement/:patientId" element={<PrintStatementScreen />} />
      <Route path="history-summary/:patientId" element={<PrintHistorySummaryScreen />} />
      <Route path="prescription/:id" element={<PrintPrescriptionScreen />} />
      <Route path="estimate/:patientId" element={<PrintEstimateScreen />} />
      <Route path="consent/:patientId" element={<PrintConsentScreen />} />
      <Route path="certificate/:id" element={<PrintCertificateScreen />} />
      <Route path="blank" element={<PrintBlankFormsScreen />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
