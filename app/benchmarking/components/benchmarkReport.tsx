import React from 'react';
import { CookbooksBenchmarkResult } from '@/app/benchmarking/types/benchmarkReportTypes';
import { Button, ButtonType } from '@/app/components/button';
import { BenchmarkReportSectionOne } from './benchmarkReportSectionOne';
import { BenchmarkReportSectionTwo } from './benchmarkReportSectionTwo';
import html2pdf from 'jspdf-html2canvas';

type BenchmarkReportProps = {
  benchmarkResult: CookbooksBenchmarkResult;
  runnerInfo: Runner;
  endpointId: string;
};

function BenchmarkReport(props: BenchmarkReportProps) {
  const { benchmarkResult, endpointId, runnerInfo } = props;
  const downloadUrl = `/api/v1/benchmarks/results/${benchmarkResult.metadata.id}?download=true`;
  const reportDivRef = React.useRef<HTMLDivElement>(null);
  async function printPdf(htmlElement: HTMLDivElement) {
    const pages = htmlElement.querySelectorAll(
      '.page'
    ) as unknown as HTMLElement[];
    const pdf = await html2pdf(pages, {
      jsPDF: {
        format: 'a4',
      },
      imageType: 'image/jpeg',
      output: './pdf/generate.pdf',
    });
  }

  const handleDownload = async () => {
    if (reportDivRef.current) {
      await printPdf(reportDivRef.current);
    }
  };

  return (
    <div
      ref={reportDivRef}
      className="flex flex-col gap-8 bg-moongray-800"
      style={{ backgroundColor: '#464349' }}>
      <div className="page">
        <BenchmarkReportSectionOne
          benchmarkReport={benchmarkResult}
          runnerInfo={runnerInfo}
          endpointId={endpointId}
        />
      </div>
      <div
        className="page"
        style={{ backgroundColor: '#464349' }}>
        <BenchmarkReportSectionTwo
          benchmarkResult={benchmarkResult}
          endpointId={endpointId}
        />
      </div>
      <footer className="flex justify-center pb-10">
        <Button
          mode={ButtonType.OUTLINE}
          size="lg"
          text="Download PDF"
          hoverBtnColor="#524e56"
          onClick={handleDownload}
        />
        <a
          data-download="hide"
          href={downloadUrl}
          download>
          <Button
            mode={ButtonType.OUTLINE}
            size="lg"
            text="Download Detailed Scoring JSON"
            hoverBtnColor="#524e56"
          />
        </a>
      </footer>
    </div>
  );
}

export { BenchmarkReport };
