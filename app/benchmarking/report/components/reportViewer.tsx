'use client';
import html2pdfjs from 'html2pdf.js';
import React from 'react';
import { flushSync } from 'react-dom';
import { CookbooksBenchmarkResult } from '@/app/benchmarking/report/types/benchmarkReportTypes';
import { CookbookCategoryLabels } from '@/app/benchmarking/report/types/benchmarkReportTypes';
import { MainSectionSurface } from '@/app/components/mainSectionSurface';
import { colors } from '@/app/customColors';
import { HeaderControls } from './headerControls';
import { Report } from './report';

type ReportViewerProps = {
  benchmarkResult: CookbooksBenchmarkResult;
  runnerNameAndDescription: RunnerHeading;
  cookbookCategoryLabels: CookbookCategoryLabels;
  cookbooksInReport: Cookbook[];
  recipes: Recipe[];
};

const PrintingContext = React.createContext({
  prePrintingFlagEnabled: false,
});

function ReportViewer(props: ReportViewerProps) {
  const { benchmarkResult, runnerNameAndDescription } = props;
  const [prePrintingFlagEnabled, setDisableExpandAnimation] =
    React.useState(false);
  const [expanded, setExpanded] = React.useState(false);
  const [selectedEndpointId, setSelectedEndpointId] = React.useState(
    benchmarkResult.metadata.endpoints[0]
  );
  const reportRef = React.useRef<HTMLDivElement>(null);

  async function printReport() {
    if (!reportRef.current) return;
    const report = reportRef.current;
    await html2pdfjs(report, {
      filename: `report-${runnerNameAndDescription.name}-${selectedEndpointId}.pdf`,
      image: { type: 'png' },
      jsPDF: { format: 'a4', orientation: 'portrait' },
    });
    setExpanded(false);
    setDisableExpandAnimation(false);
  }

  function handleHeaderBtnClick() {
    flushSync(() => {
      setDisableExpandAnimation(true);
    });
    flushSync(() => {
      setExpanded(true);
    });
    setTimeout(() => {
      printReport();
    }, 0);
  }

  return (
    <MainSectionSurface
      closeLinkUrl="/benchmarking"
      height="100%"
      minHeight={750}
      bgColor={colors.moongray['950']}>
      <div className="relative flex flex-col gap-5 items-center h-full">
        <HeaderControls
          benchmarkResult={benchmarkResult}
          onEndpointChange={setSelectedEndpointId}
          onBtnClick={handleHeaderBtnClick}
        />
        <PrintingContext.Provider value={{ prePrintingFlagEnabled }}>
          <Report
            {...props}
            endpointId={selectedEndpointId}
            ref={reportRef}
            expanded={expanded}
          />
        </PrintingContext.Provider>
      </div>
    </MainSectionSurface>
  );
}

export { ReportViewer, PrintingContext };
