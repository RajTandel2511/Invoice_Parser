import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, FileText, X } from 'lucide-react';
import { api } from '@/lib/api';
import * as pdfjsLib from 'pdfjs-dist';
import { Switch } from '@/components/ui/switch';

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;

interface PagePreviewProps {
  uploadedFiles: Array<{
    filename: string;
    size: number;
    uploadedAt: string;
    path: string;
  }>;
  onClose?: () => void;
}

interface PageInfo {
  pageNumber: number;
  filename: string;
  thumbnail?: string;
}

interface PDFFileInfo {
  filename: string;
  pageCount: number;
  path: string;
}

export default function PagePreview({ uploadedFiles, onClose }: PagePreviewProps) {
  const [pagePreviews, setPagePreviews] = useState<PageInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pdfFilesInfo, setPdfFilesInfo] = useState<PDFFileInfo[]>([]);
  const [thumbnailErrors, setThumbnailErrors] = useState<string[]>([]);
  const [isSplitting, setIsSplitting] = useState(false);
  const [isSplitMode, setIsSplitMode] = useState(false);
  const [splitPages, setSplitPages] = useState<PageInfo[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [isManualSplitMode, setIsManualSplitMode] = useState(false);
  const [manualSplitPoints, setManualSplitPoints] = useState<number[]>([]);
  const [isManualSplitting, setIsManualSplitting] = useState(false);
  const [pageGroups, setPageGroups] = useState<number[][]>([]);

  // Filter only PDF files - memoized to prevent infinite re-renders
  const pdfFiles = useMemo(() => 
    uploadedFiles.filter(file => 
      file.filename.toLowerCase().endsWith('.pdf')
    ), [uploadedFiles]
  );

  useEffect(() => {
    let isMounted = true;
    
    if (pdfFiles.length > 0 && !isLoading) {
      generatePagePreviews(isMounted);
    }
    
    return () => {
      isMounted = false;
    };
  }, [pdfFiles.length]);

  const generatePDFThumbnail = async (pdfBlob: Blob, pageNumber: number): Promise<string> => {
    try {
      const pdfUrl = URL.createObjectURL(pdfBlob);
      const loadingTask = pdfjsLib.getDocument(pdfUrl);
      const pdf = await loadingTask.promise;
      const page = await pdf.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 0.5 });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Could not get canvas context');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const renderContext = { canvasContext: context, viewport } as any;
      await page.render(renderContext).promise;
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      URL.revokeObjectURL(pdfUrl);
      return dataUrl;
    } catch {
      return '';
    }
  };

  const generatePagePreviews = async (isMounted: boolean = true) => {
    setIsLoading(true);
    setThumbnailErrors([]);
    try {
      const result = await api.getPDFPages();
      if (!isMounted) return;
      if (result.success && result.pdfFiles) {
        setPdfFilesInfo(result.pdfFiles);
        const pages: PageInfo[] = [];
        for (const pdfFile of result.pdfFiles) {
          for (let i = 1; i <= pdfFile.pageCount; i++) {
            pages.push({ pageNumber: i, filename: pdfFile.filename });
          }
        }
        setPagePreviews(pages);
        await generateRealThumbnails(pages, isMounted);
      }
    } finally {
      if (isMounted) setIsLoading(false);
    }
  };

  const generateRealThumbnails = async (pages: PageInfo[], isMounted: boolean) => {
    for (let i = 0; i < pages.length; i++) {
      if (!isMounted) break;
      const page = pages[i];
      try {
        const result = await api.getPDFFile(page.filename);
        if (result.success && result.blob) {
          const thumbnail = await generatePDFThumbnail(result.blob, page.pageNumber);
          if (isMounted && thumbnail) {
            setPagePreviews(prev => prev.map(p => p.filename === page.filename && p.pageNumber === page.pageNumber ? { ...p, thumbnail } : p));
          }
        }
      } catch (error) {
        setThumbnailErrors(prev => [...prev, `Error processing ${page.filename} page ${page.pageNumber}: ${error}`]);
      }
    }
  };

  const generateSplitThumbnails = async (pages: PageInfo[], isMounted: boolean) => {
    for (let i = 0; i < pages.length; i++) {
      if (!isMounted) break;
      const page = pages[i];
      try {
        const result = await api.getSplitPDFFile(page.filename);
        if (result.success && result.blob) {
          const thumbnail = await generatePDFThumbnail(result.blob, 1);
          if (isMounted && thumbnail) {
            setSplitPages(prev => prev.map(p => p.filename === page.filename ? { ...p, thumbnail } : p));
          }
        }
      } catch (error) {
        setThumbnailErrors(prev => [...prev, `Error processing split file ${page.filename}: ${error}`]);
      }
    }
  };

  const openBlobInNewTab = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_blank', 'noopener,noreferrer');
    if (win) {
      // Prevent the new window from having access to the opener for security
      win.opener = null;
    }
    // Revoke after some time to let the tab load fully
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  };

  const handlePreviewOriginalPDF = async () => {
    try {
      if (pdfFilesInfo.length === 0) return;
      // For now, preview the first uploaded PDF (common case: a single combined PDF)
      const targetFilename = pdfFilesInfo[0].filename;
      const result = await api.getPDFFile(targetFilename);
      if (result.success && result.blob) {
        openBlobInNewTab(result.blob, targetFilename);
      } else {
        alert('Could not load the original PDF for preview.');
      }
    } catch (error) {
      console.error('Preview original PDF error:', error);
      alert('Failed to open preview.');
    }
  };

  const handleSplitToggle = async (checked: boolean) => {
    if (checked) {
      if (isSplitting) return;
      setIsSplitting(true);
      try {
        const result = await api.splitPDFPages();
        if (result.success) {
          const splitPageInfos: PageInfo[] = [];
          if (result.splitFiles) {
            result.splitFiles.forEach((filename: string, index: number) => {
              splitPageInfos.push({ pageNumber: index + 1, filename });
            });
          }
          setSplitPages(splitPageInfos);
          setIsSplitMode(true);
          // Initialize page groups - each page starts as individual
          setPageGroups(splitPageInfos.map((_, index) => [index + 1]));
          await generateSplitThumbnails(splitPageInfos, true);
        }
      } finally {
        setIsSplitting(false);
      }
    } else {
      setIsSplitMode(false);
      setSplitPages([]);
      setPageGroups([]);
    }
  };

  const handleManualSplitToggle = () => {
    if (isManualSplitMode) {
      // Exit manual split mode
      setIsManualSplitMode(false);
      setManualSplitPoints([]);
    } else {
      // Enter manual split mode
      setIsManualSplitMode(true);
      setManualSplitPoints([]);
    }
  };

  const handleManualSplitPoint = (pageNumber: number) => {
    setManualSplitPoints(prev => {
      if (prev.includes(pageNumber)) {
        // Remove split point if already exists
        return prev.filter(p => p !== pageNumber);
      } else {
        // Add split point
        return [...prev, pageNumber].sort((a, b) => a - b);
      }
    });
  };

  const handlePageGrouping = (pageNumber: number) => {
    console.log(`🔄 Grouping: Clicked green line after page ${pageNumber}, trying to group with page ${pageNumber + 1}`);
    
    setPageGroups(prev => {
      // pageNumber represents the page BEFORE the green line
      // We want to group pageNumber with pageNumber + 1
      const nextPage = pageNumber + 1;
      
      if (nextPage > splitPages.length) {
        console.log(`❌ Can't group beyond the last page (${splitPages.length})`);
        return prev;
      }
      
      console.log(`📋 Current groups:`, prev);
      console.log(`🎯 Trying to group page ${pageNumber} with page ${nextPage}`);
      
      // Find if either page is already in a group
      let page1GroupIndex = -1;
      let page2GroupIndex = -1;
      
      for (let i = 0; i < prev.length; i++) {
        if (prev[i].includes(pageNumber)) {
          page1GroupIndex = i;
        }
        if (prev[i].includes(nextPage)) {
          page2GroupIndex = i;
        }
      }
      
      console.log(`🔍 Page ${pageNumber} is in group ${page1GroupIndex}, Page ${nextPage} is in group ${page2GroupIndex}`);
      
      // Case 1: Both pages are in the same group - ungroup them
      if (page1GroupIndex !== -1 && page1GroupIndex === page2GroupIndex) {
        console.log(`✂️ Ungrouping: Both pages are in the same group ${page1GroupIndex}`);
        const currentGroup = prev[page1GroupIndex];
        if (currentGroup.length === 2 && currentGroup.includes(pageNumber) && currentGroup.includes(nextPage)) {
          // Simple case: just split the 2-page group
          const newGroups = [...prev];
          newGroups[page1GroupIndex] = [pageNumber];
          newGroups.splice(page1GroupIndex + 1, 0, [nextPage]);
          console.log(`✅ Split 2-page group into individual pages`);
          return newGroups;
        } else if (currentGroup.length > 2) {
          // Complex case: split a larger group
          const newGroups = [...prev];
          const beforePages = currentGroup.filter(p => p < pageNumber);
          const afterPages = currentGroup.filter(p => p > nextPage);
          
          if (beforePages.length > 0 && afterPages.length > 0) {
            // Split into three groups: before, middle, after
            newGroups[page1GroupIndex] = beforePages;
            newGroups.splice(page1GroupIndex + 1, 0, [pageNumber], [nextPage], afterPages);
          } else if (beforePages.length > 0) {
            // Split into two groups: before, middle
            newGroups[page1GroupIndex] = beforePages;
            newGroups.splice(page1GroupIndex + 1, 0, [pageNumber], [nextPage]);
          } else if (afterPages.length > 0) {
            // Split into two groups: middle, after
            newGroups[page1GroupIndex] = [pageNumber];
            newGroups.splice(page1GroupIndex + 1, 0, [nextPage], afterPages);
          } else {
            // Just split the two pages
            newGroups[page1GroupIndex] = [pageNumber];
            newGroups.splice(page1GroupIndex + 1, 0, [nextPage]);
          }
          console.log(`✅ Split larger group into multiple groups`);
          return newGroups;
        }
      }
      
      // Case 2: Pages are in different groups - merge the groups
      if (page1GroupIndex !== -1 && page2GroupIndex !== -1 && page1GroupIndex !== page2GroupIndex) {
        console.log(`🔗 Merging: Pages are in different groups, merging groups ${page1GroupIndex} and ${page2GroupIndex}`);
        const newGroups = [...prev];
        const group1 = newGroups[page1GroupIndex];
        const group2 = newGroups[page2GroupIndex];
        
        // Merge the groups
        newGroups[page1GroupIndex] = [...group1, ...group2].sort((a, b) => a - b);
        newGroups.splice(page2GroupIndex, 1);
        console.log(`✅ Merged groups into one`);
        return newGroups;
      }
      
      // Case 3: One page is in a group, other is not - add the free page to the group
      if (page1GroupIndex !== -1 && page2GroupIndex === -1) {
        console.log(`➕ Adding page ${nextPage} to existing group ${page1GroupIndex}`);
        const newGroups = [...prev];
        newGroups[page1GroupIndex] = [...newGroups[page1GroupIndex], nextPage].sort((a, b) => a - b);
        console.log(`✅ Added page to existing group`);
        return newGroups;
      }
      
      if (page2GroupIndex !== -1 && page1GroupIndex === -1) {
        console.log(`➕ Adding page ${pageNumber} to existing group ${page2GroupIndex}`);
        const newGroups = [...prev];
        newGroups[page2GroupIndex] = [pageNumber, ...newGroups[page2GroupIndex]].sort((a, b) => a - b);
        console.log(`✅ Added page to existing group`);
        return newGroups;
      }
      
      // Case 4: Neither page is in a group - create a new group
      if (page1GroupIndex === -1 && page2GroupIndex === -1) {
        console.log(`🆕 Creating new group with pages ${pageNumber} and ${nextPage}`);
        return [...prev, [pageNumber, nextPage]];
      }
      
      console.log(`⚠️ No action taken, returning current groups`);
      return prev;
    });
  };

  const executeManualSplit = async () => {
    if (manualSplitPoints.length === 0 || isManualSplitting) return;
    
    setIsManualSplitting(true);
    try {
      // Create groups based on split points
      const groups: { start: number; end: number; pages: number[] }[] = [];
      let currentStart = 1;
      
      for (const splitPoint of manualSplitPoints) {
        const groupPages = [];
        for (let i = currentStart; i <= splitPoint; i++) {
          groupPages.push(i);
        }
        groups.push({
          start: currentStart,
          end: splitPoint,
          pages: groupPages
        });
        currentStart = splitPoint + 1;
      }
      
      // Add the last group (from last split point to end)
      if (currentStart <= pagePreviews.length) {
        const lastGroupPages = [];
        for (let i = currentStart; i <= pagePreviews.length; i++) {
          lastGroupPages.push(i);
        }
        groups.push({
          start: currentStart,
          end: pagePreviews.length,
          pages: lastGroupPages
        });
      }
      
      console.log('Manual split groups:', groups);
      
      // Call API to create manual split PDFs
      const result = await api.createManualSplitPDFs(groups);
      
      if (result.success) {
        console.log('Manual split created successfully:', result.splitFiles);
        
        // Automatically export the grouped PDFs to uploads folder
        console.log('Auto-exporting grouped PDFs to uploads folder...');
        const exportResult = await api.exportSplitPDFs();
        
        if (exportResult.success) {
          console.log('Grouped PDFs exported successfully:', exportResult.exportedFiles);
          alert(`Successfully created ${groups.length} custom PDF groups and exported them to uploads folder!`);
        } else {
          console.error('Failed to export grouped PDFs:', exportResult.message);
          alert(`PDFs created but failed to export: ${exportResult.message}`);
        }
        
        // Exit manual split mode
        setIsManualSplitMode(false);
        setManualSplitPoints([]);
      } else {
        console.error('Failed to create manual split:', result.message);
        alert(`Failed to create manual split: ${result.message}`);
      }
    } catch (error) {
      console.error('Error in manual split:', error);
      alert('An error occurred while creating manual split');
    } finally {
      setIsManualSplitting(false);
    }
  };

  const handleExportSplitPDFs = async () => {
    if (isExporting || splitPages.length === 0) return;
    
    setIsExporting(true);
    try {
      console.log('Exporting grouped PDFs to uploads folder...');
      
      // Use page groups if available, otherwise export individual pages
      const groupsToExport = pageGroups.length > 0 ? pageGroups : splitPages.map((_, index) => [index + 1]);
      
      console.log('Exporting groups:', groupsToExport);
      
      // Use the new grouped export API
      const result = await api.exportGroupedPDFs(groupsToExport);
      
      if (result.success) {
        console.log('Grouped PDFs exported successfully:', result.exportedFiles);
        const groupCount = groupsToExport.length;
        const totalPages = groupsToExport.reduce((sum, group) => sum + group.length, 0);
        alert(`Successfully exported ${groupCount} groups (${totalPages} total pages) to uploads folder!`);
      } else {
        console.error('Failed to export grouped PDFs:', result.message);
        alert(`Failed to export grouped PDFs: ${result.message}`);
      }
    } catch (error) {
      console.error('Error exporting grouped PDFs:', error);
      alert('An error occurred while exporting grouped PDFs');
    } finally {
      setIsExporting(false);
    }
  };

  if (pdfFiles.length === 0) {
    return null;
  }

  return (
    <Card className="shadow-lg border-border bg-gradient-to-br from-background to-muted/20">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              isManualSplitMode 
                ? 'bg-purple-100 dark:bg-purple-900/20' 
                : isSplitMode 
                  ? 'bg-green-100 dark:bg-green-900/20' 
                  : 'bg-blue-100 dark:bg-blue-900/20'
            }`}>
              {isManualSplitMode ? (
                <span className="text-2xl">✂️</span>
              ) : isSplitMode ? (
                <FileText className="h-6 w-6 text-green-600" />
              ) : (
                <Eye className="h-6 w-6 text-blue-600" />
              )}
            </div>
            <div>
              <CardTitle className="text-xl">
                {isManualSplitMode ? 'Manual Split Mode' : isSplitMode ? 'Split Pages View' : 'Page Preview'}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {isManualSplitMode 
                  ? `Click between pages to mark split points. Current splits: ${manualSplitPoints.length}` 
                  : isSplitMode 
                    ? `Viewing ${splitPages.length} individual page files${pageGroups.length > 0 ? ` • ${pageGroups.length} groups` : ''}` 
                    : 'Preview all pages from uploaded PDF files'
                }
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300">
                {isSplitMode ? splitPages.length : pagePreviews.length} Pages
              </Badge>
              {/* Preview original PDF button */}
              {!isSplitMode && pdfFilesInfo.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreviewOriginalPDF}
                  className="h-8 px-3 text-xs bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700"
                >
                  <Eye className="h-3 w-3 mr-1" /> Preview
                </Button>
              )}
              {isSplitMode && (
                <Badge variant="secondary" className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-300 dark:border-green-600">
                  Split Mode
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Page Break All</span>
              <Switch checked={isSplitMode} disabled={isSplitting || isManualSplitMode} onCheckedChange={handleSplitToggle} />
              
              {/* Manual Split button */}
              <Button
                variant={isManualSplitMode ? "default" : "outline"}
                size="sm"
                onClick={handleManualSplitToggle}
                disabled={isSplitting || isManualSplitting}
                className={`h-8 px-3 text-xs transition-all duration-200 ${
                  isManualSplitMode 
                    ? 'bg-purple-600 hover:bg-purple-700 text-white border-purple-600 shadow-md' 
                    : 'bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 dark:hover:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700'
                }`}
              >
                ✂️ Manual Split
              </Button>
              
              {/* Execute Manual Split button - only visible in manual split mode */}
              {isManualSplitMode && manualSplitPoints.length > 0 && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={executeManualSplit}
                  disabled={isManualSplitting}
                  className="h-8 px-3 text-xs bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {isManualSplitting ? (
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                  ) : (
                    <span>✂️ Split Now</span>
                  )}
                </Button>
              )}
              
              {/* Export button - only visible in split mode */}
              {isSplitMode && splitPages.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportSplitPDFs}
                  disabled={isExporting}
                  className="h-8 px-3 text-xs bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700"
                >
                  {isExporting ? (
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-green-600 mr-2"></div>
                  ) : (
                    <FileText className="h-3 w-3 mr-1" />
                  )}
                  Export to Uploads
                </Button>
              )}
            </div>
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading || isSplitting || isManualSplitting ? (
          <div className="p-8 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className={`p-4 rounded-full ${isSplitting || isManualSplitting ? 'bg-orange-100 dark:bg-orange-900/30' : 'bg-muted/50'}`}>
                <div className={`animate-spin rounded-full h-8 w-8 border-b-2 ${isSplitting || isManualSplitting ? 'border-orange-600' : 'border-primary'}`}></div>
              </div>
              <div>
                <p className="text-lg font-medium text-foreground mb-2">{isSplitting || isManualSplitting ? 'Splitting PDF Pages...' : 'Generating previews...'}</p>
                <p className="text-muted-foreground">{isSplitting || isManualSplitting ? 'Creating individual files for each page' : 'Processing PDF pages and creating real thumbnails'}</p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {isSplitMode && (
              <div className="mb-2 text-xs text-muted-foreground">Split view shows a divider line between every consecutive page.</div>
            )}
            <div className={`grid ${
                isSplitMode 
                ? 'gap-2 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5' 
                : 'gap-6 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
            } ${isManualSplitMode ? 'cursor-crosshair' : ''}`}>
              {(isSplitMode ? splitPages : pagePreviews).map((page, index, arr) => (
                <div key={`${page.filename}-${page.pageNumber}`} className="relative">
                  <div
                    className="relative group cursor-pointer"
                  >
                    <div className="aspect-[4/5] bg-muted/30 rounded-lg border border-border/50 overflow-hidden hover:border-primary/50 transition-all duration-200 hover:shadow-md">
                      {page.thumbnail ? (
                        <div className="h-full w-full relative">
                          <img 
                            src={page.thumbnail} 
                            alt={`Page ${page.pageNumber} of ${page.filename}`}
                            className="w-full h-full object-cover"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                          <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-1 text-xs">
                            <div className="truncate">
                              {page.filename.length > 20 ? `${page.filename.substring(0, 20)}...` : page.filename}
                            </div>
                            <div>Page {page.pageNumber}</div>
                          </div>
                        </div>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center p-2 text-center">
                          <div className="p-2 bg-muted/50 rounded-full mb-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div className="text-xs font-medium text-foreground mb-1">
                            {page.filename.length > 20 ? `${page.filename.substring(0, 20)}...` : page.filename}
                          </div>
                          <div className="text-xs text-muted-foreground">Page {page.pageNumber}</div>
                          <div className="text-xs text-muted-foreground mt-1">Loading thumbnail...</div>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                        <div className="p-1 bg-background/90 rounded-lg">
                          <Eye className="h-3 w-3 text-primary" />
                        </div>
                      </div>
                    </div>
                    <div className="absolute -top-1 -right-1">
                      <Badge variant="secondary" className="text-xs px-1 py-0.5">{page.pageNumber}</Badge>
                    </div>
                    
                    {/* Vertical dashed separator for split mode - clickable for grouping */}
                    {isSplitMode && index < arr.length - 1 && (
                      <div 
                        className="absolute -right-1 top-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-green-500/60 to-transparent border-r border-dashed border-green-500/60 cursor-pointer hover:bg-green-400/80 transition-colors duration-200 z-10"
                        onClick={() => handlePageGrouping(page.pageNumber)}
                        title="Click to group/ungroup pages"
                      />
                    )}
                  </div>
                  
                  {/* Clickable split zone - positioned on the right edge of the page */}
                  {isManualSplitMode && index < arr.length - 1 && (
                    <div
                      className="absolute -right-3 top-0 bottom-0 w-1 cursor-crosshair hover:bg-purple-100/50 dark:hover:bg-purple-900/20 transition-colors duration-200 group z-10"
                      onClick={() => handleManualSplitPoint(page.pageNumber)}
                    >
                      {/* Vertical split line when active */}
                      {manualSplitPoints.includes(page.pageNumber) && (
                        <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-purple-500 shadow-lg transform -translate-x-1/2">
                          <div className="absolute -top-1 left-1/2 transform -translate-x-1/2">
                            <span className="text-xs bg-purple-500 text-white px-1 py-0.5 rounded-full shadow-md whitespace-nowrap">
                              ✂️
                            </span>
                          </div>
                        </div>
                      )}
                      
                      {/* Hover indicator */}
                      {!manualSplitPoints.includes(page.pageNumber) && (
                        <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <div className="w-4 h-4 bg-purple-500/20 rounded-full flex items-center justify-center">
                            <span className="text-purple-600 text-xs">✂️</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {/* Show current page grouping status */}
            {isSplitMode && pageGroups.length > 0 && (
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Current Page Groups:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {pageGroups.map((group, groupIndex) => (
                    <Badge 
                      key={groupIndex} 
                      variant="outline" 
                      className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-600"
                    >
                      {group.length === 1 ? `Page ${group[0]}` : `Pages ${group[0]}-${group[group.length - 1]}`}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                  💡 Click the green lines between pages to group/ungroup them
                </p>
              </div>
            )}
          </>
        )}

        {thumbnailErrors.length > 0 && (
          <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <div className="text-sm text-red-700 dark:text-red-300">
              <strong>Thumbnail Errors:</strong>
              <ul className="mt-2 list-disc list-inside">
                {thumbnailErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {pagePreviews.length > 0 && (
          <div className="mt-4 p-4 bg-muted/30 rounded-lg border border-border/50">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {pdfFiles.length} PDF file{pdfFiles.length > 1 ? 's' : ''} • {pagePreviews.length} total pages
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
