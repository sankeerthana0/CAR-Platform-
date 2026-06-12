import React, { useState, useEffect } from "react";
import { SQLTemplate, Customer, CohortRow } from "../types";
import { SQL_TEMPLATES, executeSQLMock } from "../data";
import { Database, Terminal, Play, RotateCcw, AlertCircle, FileSpreadsheet, Search, Check, RefreshCw } from "lucide-react";

interface SQLEditorProps {
  customers: Customer[];
  cohorts: CohortRow[];
}

export function SQLEditor({ customers, cohorts }: SQLEditorProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<SQLTemplate>(SQL_TEMPLATES[0]);
  const [rawQuery, setRawQuery] = useState<string>(SQL_TEMPLATES[0].query);
  const [executing, setExecuting] = useState<boolean>(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [searchFilter, setSearchFilter] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);

  // Result states
  const [result, setResult] = useState<{
    headers: string[];
    rows: any[];
    count: number;
    executionTimeMs: number;
  } | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const rowsPerPage = 10;

  useEffect(() => {
    // Run the initial default query on mount
    handleRunQuery(SQL_TEMPLATES[0].query);
  }, []);

  // Update query when template is swapped
  const handleSelectTemplate = (tpl: SQLTemplate) => {
    setSelectedTemplate(tpl);
    setRawQuery(tpl.query);
    handleRunQuery(tpl.query);
  };

  const handleRunQuery = (queryToRun: string) => {
    setExecuting(true);
    setCurrentPage(1);
    
    const timestamp = new Date().toLocaleTimeString();
    const newLogs = [
      `[${timestamp}] INITIALIZING QUERY ENGINE CONTEXT...`,
      `[${timestamp}] SCANNING TARGET SYSTEM RELATION CATALOG FOR METADATA...`,
      `[${timestamp}] COMPILING STATEMENT AND ESTABLISHING EXECUTION PATHS...`
    ];
    setLogs(newLogs);

    setTimeout(() => {
      try {
        const queryOutcome = executeSQLMock(queryToRun, customers, cohorts);
        const doneTime = new Date().toLocaleTimeString();
        
        setResult(queryOutcome);
        setLogs(prev => [
          ...prev,
          `[${doneTime}] PARSER DETECTED STATEMENT: SELECT ROWS FROM TABLE`,
          `[${doneTime}] RESOLVED ${queryOutcome.count} RECORDS IN ${queryOutcome.executionTimeMs}ms.`,
          `[${doneTime}] PIPELINE COMPLETED SUCCESSFULLY.`
        ]);
      } catch (err: any) {
        setLogs(prev => [...prev, `[ERROR] SQL Compile failure: ${err.message}`]);
      } finally {
        setExecuting(false);
      }
    }, 600);
  };

  const handleResetQuery = () => {
    setRawQuery(selectedTemplate.query);
  };

  const handleCopyClipboard = () => {
    navigator.clipboard.writeText(rawQuery);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadCSV = () => {
    if (!result || result.rows.length === 0) return;
    
    // Headers line
    const csvContent = [
      result.headers.join(","),
      ...result.rows.map(row => 
        result.headers.map(h => {
          let cell = row[h];
          if (cell === null || cell === undefined) cell = "";
          // Quote strings containing commas
          if (typeof cell === "string" && cell.includes(",")) {
            return `"${cell}"`;
          }
          return cell;
        }).join(",")
      )
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `sql_query_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter and paginated rows
  const filteredRows = result
    ? result.rows.filter(r => 
        Object.values(r).some(val => 
          String(val).toLowerCase().includes(searchFilter.toLowerCase())
        )
      )
    : [];

  const totalPages = Math.ceil(filteredRows.length / rowsPerPage) || 1;
  const paginatedRows = filteredRows.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 text-[#1A1A1A]">
      {/* Templates Column Grid */}
      <div className="xl:col-span-3 flex flex-col gap-4">
        <div className="bg-white border-2 border-[#1A1A1A] p-4 shadow-[4px_4px_0px_0px_#1A1A1A]">
          <h3 className="text-xs font-mono font-bold text-[#1A1A1A] uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Database className="h-4 w-4 text-[#1A1A1A]" />
            Relation Catalog
          </h3>
          <div className="space-y-2 border-b border-[#1A1A1A] pb-3 mb-3">
            <div className="flex justify-between items-center bg-[#F9F8F6] px-3 py-2 border border-[#1A1A1A] font-mono text-[11px]">
              <span className="text-[#1A1A1A] font-semibold">📁 tbl_customers</span>
              <span className="text-[#1A1A1A]/60 font-bold">120 rows</span>
            </div>
            <div className="flex justify-between items-center bg-[#F9F8F6] px-3 py-2 border border-[#1A1A1A] font-mono text-[11px]">
              <span className="text-[#1A1A1A] font-semibold">📁 tbl_cohorts</span>
              <span className="text-[#1A1A1A]/60 font-bold">4 rows</span>
            </div>
          </div>

          <h3 className="text-xs font-mono font-bold text-[#1A1A1A] uppercase tracking-wider mb-2.5">
            SQL Playbook Recipes
          </h3>
          <div className="flex flex-col gap-2">
            {SQL_TEMPLATES.map((tpl) => (
              <button
                key={tpl.name}
                id={`sql-template-${tpl.name.toLowerCase().replace(/\s+/g, '-')}`}
                onClick={() => handleSelectTemplate(tpl)}
                className={`w-full text-left p-3 border transition-all duration-300 ${
                  selectedTemplate.name === tpl.name
                    ? "bg-[#1A1A1A] border-[#1A1A1A] text-white font-semibold"
                    : "bg-white border-[#1A1A1A]/30 text-[#1A1A1A]/70 hover:bg-[#F9F8F6] hover:text-[#1A1A1A]"
                }`}
              >
                <p className="font-bold font-serif truncate">{tpl.name}</p>
                <p className={`text-[10px] mt-1 line-clamp-2 leading-relaxed ${
                  selectedTemplate.name === tpl.name ? "text-white/80" : "text-[#1A1A1A]/60"
                }`}>
                  {tpl.description}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Compiler Console and Result Workspace Grid */}
      <div className="xl:col-span-9 flex flex-col gap-4">
        {/* SQL Input Area */}
        <div className="bg-white border-2 border-[#1A1A1A] overflow-hidden shadow-[4px_4px_0px_0px_#1A1A1A] flex flex-col">
          <div className="flex justify-between items-center bg-[#F9F8F6] px-4 py-3 border-b-2 border-[#1A1A1A]">
            <div className="flex items-center gap-2">
              <Terminal className="h-4 w-4 text-[#1A1A1A]" />
              <span className="text-xs font-mono font-bold text-[#1A1A1A]">SQL ANALYTICS EDITOR</span>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                id="sql-copy-btn"
                onClick={handleCopyClipboard}
                className="px-2.5 py-1 text-[11px] font-mono leading-none bg-white border border-[#1A1A1A] text-[#1A1A1A] font-medium hover:bg-[#1A1A1A] hover:text-white transition-all flex items-center gap-1.5"
              >
                {copied ? <Check className="h-3 w-3 text-emerald-700" /> : <Database className="h-3 w-3" />}
                {copied ? "Copied!" : "Copy Query"}
              </button>
              
              <button
                id="sql-reset-btn"
                onClick={handleResetQuery}
                className="px-2.5 py-1 text-[11px] font-mono leading-none bg-white border border-[#1A1A1A] text-[#1A1A1A]/80 hover:bg-red-50 hover:text-red-700 transition-[#1A1A1A] flex items-center gap-1"
                title="Reset to Template Default"
              >
                <RotateCcw className="h-3 w-3" />
                Reset
              </button>
              
              <button
                id="sql-execute-btn"
                onClick={() => handleRunQuery(rawQuery)}
                disabled={executing || !rawQuery.trim()}
                className="px-3.5 py-1 text-xs font-bold font-sans bg-[#1A1A1A] hover:bg-[#333333] disabled:bg-zinc-200 disabled:text-zinc-400 text-white transition-all flex items-center gap-1.5"
              >
                {executing ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5 fill-current" />}
                {executing ? "Processing..." : "Run Query"}
              </button>
            </div>
          </div>

          <div className="relative">
            <textarea
              id="sql-query-textarea"
              value={rawQuery}
              onChange={(e) => setRawQuery(e.target.value)}
              className="w-full h-36 bg-[#F9F8F6] p-4 text-xs font-mono text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#1A1A1A]/40 leading-relaxed resize-none border-b border-[#1A1A1A]"
              spellCheck="false"
              placeholder="SELECT * FROM customers WHERE actualChurn = 1 LIMIT 5;"
            />
            {executing && (
              <div className="absolute inset-0 bg-[#F9F8F6]/85 backdrop-blur-xs flex items-center justify-center">
                <div className="text-center font-mono text-[#1A1A1A] text-xs flex items-center gap-2 font-bold animate-pulse">
                  <RefreshCw className="h-4 w-4 animate-spin text-[#1A1A1A]" />
                  Compiling SQL relational instructions...
                </div>
              </div>
            )}
          </div>

          {/* Execution Pipeline Logs formatted like teleprinter output */}
          <div className="bg-[#EAE8E4] p-3 h-24 overflow-y-auto block font-mono text-[9px] text-[#1A1A1A]/75 leading-normal scrollbar-thin border-t border-[#1A1A1A]">
            {logs.map((log, lIdx) => (
              <div key={lIdx} className={log.includes("[ERROR]") ? "text-red-700 font-bold uppercase" : ""}>
                <span className="opacity-50"># </span>{log}
              </div>
            ))}
          </div>
        </div>

        {/* Results Data Table */}
        <div className="bg-white border-2 border-[#1A1A1A] overflow-hidden shadow-[4px_4px_0px_0px_#1A1A1A] flex flex-col">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-[#F9F8F6] px-4 py-3 border-b-2 border-[#1A1A1A] gap-3">
            <div className="flex items-center gap-2 font-mono">
              <Database className="h-4 w-4 text-[#1A1A1A]" />
              <span className="text-xs font-bold text-[#1A1A1A]">QUERY RESULT MATRIX</span>
              {result && (
                <span className="text-[10px] bg-[#1A1A1A] text-white px-2.5 py-0.5 rounded-none font-bold">
                  {filteredRows.length} Rows · {result.executionTimeMs}ms
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#1A1A1A]/50" />
                <input
                  type="text"
                  placeholder="Filter local records..."
                  value={searchFilter}
                  onChange={(e) => {
                    setSearchFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full sm:w-48 pl-8 pr-3 py-1 bg-white border border-[#1A1A1A] text-xs focus:outline-none focus:border-[#1A1A1A] font-mono text-[#1A1A1A] placeholder-[#1A1A1A]/40"
                />
              </div>

              <button
                id="sql-download-csv"
                onClick={handleDownloadCSV}
                disabled={!result || result.rows.length === 0}
                className="px-2.5 py-1 bg-white hover:bg-[#1A1A1A] hover:text-white disabled:text-zinc-300 disabled:border-zinc-200 border border-[#1A1A1A] text-[#1A1A1A] transition-all text-xs flex items-center gap-1.5"
                title="Download CSV Results"
              >
                <FileSpreadsheet className="h-3.5 w-3.5 text-[#1A1A1A]" />
                Export CSV
              </button>
            </div>
          </div>

          <div className="overflow-x-auto min-h-[160px]">
            {result && result.headers.length > 0 ? (
              <table className="w-full text-left text-xs border-collapse font-sans">
                <thead>
                  <tr className="bg-[#EAE8E4] border-b-2 border-[#1A1A1A]">
                    {result.headers.map((hdr) => (
                      <th key={hdr} className="py-2.5 px-4 font-mono text-[#1A1A1A] font-bold uppercase tracking-wider text-[10px]">
                        {hdr}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1A1A1A]/10">
                  {paginatedRows.length > 0 ? (
                    paginatedRows.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-[#F9F8F6] transition-all duration-150">
                        {result.headers.map((hdr) => {
                          let cellValue = row[hdr];
                          
                          // Custom style outputs
                          let displayVal = String(cellValue);
                          let colorClass = "text-[#1A1A1A]/90";

                          if (cellValue === true) {
                            displayVal = "Active Risk";
                            colorClass = "text-red-700 font-bold bg-red-100/50 px-1.5 py-0.5 border border-red-500/30 text-[10px] uppercase font-mono";
                          } else if (cellValue === false) {
                            displayVal = "Retained";
                            colorClass = "text-emerald-800 font-bold bg-emerald-100/50 px-1.5 py-0.5 border border-emerald-500/30 text-[10px] uppercase font-mono";
                          } else if (hdr.toLowerCase().includes("prob") && typeof cellValue === "number") {
                            colorClass = cellValue > 0.6 ? "text-red-700 font-mono font-bold" : "text-[#1A1A1A]/70 font-mono";
                            displayVal = `${(cellValue * 100).toFixed(1)}%`;
                          } else if (typeof cellValue === "number") {
                            colorClass = "text-[#1A1A1A]/70 font-mono";
                          }

                          return (
                            <td key={hdr} className="py-2.5 px-4">
                              <span className={colorClass}>{displayVal}</span>
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={result.headers.length} className="py-12 text-center text-[#1A1A1A]/60 italic font-serif">
                        No rows conform to searching filter: &quot;{searchFilter}&quot;.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-[#1A1A1A]/50">
                <AlertCircle className="h-8 w-8 text-[#1A1A1A]/35 mb-2" />
                <p className="text-xs font-serif italic">Execute a command query to visualize relational outputs.</p>
              </div>
            )}
          </div>

          {/* Simple Pagination Footer */}
          {result && filteredRows.length > rowsPerPage && (
            <div className="flex justify-between items-center px-4 py-3 border-t-2 border-[#1A1A1A] bg-[#F9F8F6] font-mono text-[11px] text-[#1A1A1A]">
              <span>
                Showing <strong className="text-black font-bold">{Math.min(filteredRows.length, (currentPage - 1) * rowsPerPage + 1)}-{Math.min(filteredRows.length, currentPage * rowsPerPage)}</strong> of <strong className="text-black font-bold">{filteredRows.length}</strong> records
              </span>

              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-2 py-1 bg-white border border-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-black font-semibold text-[#1A1A1A] cursor-pointer"
                >
                  Previous
                </button>
                <span className="py-1 px-3 bg-[#EAE8E4] border border-[#1A1A1A]/50 font-bold">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-2 py-1 bg-white border border-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-black font-semibold text-[#1A1A1A] cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

