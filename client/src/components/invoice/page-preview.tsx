import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, FileText, X } from 'lucide-react';
import { api } from '@/lib/api';
import * as pdfjsLib from 'pdfjs-dist';

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

  // Filter only PDF files - memoized to prevent infinite re-renders
  const pdfFiles = useMemo(() => 
    uploadedFiles.filter(file => 
      file.filename.toLowerCase().endsWith('.pdf')
    ), [uploadedFiles]
  );

  useEffect(() => {
    let isMounted = true;
    
    console.log('PagePreview useEffect triggered:', { pdfFilesLength: pdfFiles.length, isLoading });
    
    if (pdfFiles.length > 0 && !isLoading) {
      console.log('Calling generatePagePreviews');
      generatePagePreviews(isMounted);
    }
    
    return () => {
      console.log('PagePreview useEffect cleanup');
      isMounted = false;
    };
  }, [pdfFiles.length]); // Only depend on the length, not the array itself

  const generatePDFThumbnail = async (pdfBlob: Blob, pageNumber: number): Promise<string> => {
    try {
      console.log('Generating PDF thumbnail for page', pageNumber);
      
      // Create object URL from blob
      const pdfUrl = URL.createObjectURL(pdfBlob);
      
      // Load PDF document
      const loadingTask = pdfjsLib.getDocument(pdfUrl);
      const pdf = await loadingTask.promise;
      console.log('PDF loaded, total pages:', pdf.numPages);
      
      // Get the specific page
      const page = await pdf.getPage(pageNumber);
      console.log('Page loaded:', pageNumber);
      
      // Create viewport for thumbnail (smaller scale)
      const viewport = page.getViewport({ scale: 0.5 });
      
      // Create canvas
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      if (!context) {
        throw new Error('Could not get canvas context');
      }
      
      // Set canvas dimensions
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      
      // Render page to canvas
      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };
      
      console.log('Rendering page to canvas...');
      await page.render(renderContext).promise;
      console.log('Page rendered successfully');
      
      // Convert canvas to data URL
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      console.log('Thumbnail generated, size:', dataUrl.length);
      
      // Clean up
      URL.revokeObjectURL(pdfUrl);
      
      return dataUrl;
    } catch (error) {
      console.error('Error generating PDF thumbnail for page', pageNumber, ':', error);
      return '';
    }
  };

  const generatePagePreviews = async (isMounted: boolean = true) => {
    console.log('generatePagePreviews called, isLoading:', isLoading);
    setIsLoading(true);
    setThumbnailErrors([]);
    
    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (isMounted) {
        console.log('Timeout reached, setting loading to false');
        setIsLoading(false);
      }
    }, 30000); // 30 second timeout for PDF processing
    
    try {
      console.log('Fetching PDF page information from backend...');
      // Fetch actual PDF page information from backend
      const result = await api.getPDFPages();
      console.log('Backend response:', result);
      
      clearTimeout(timeoutId); // Clear timeout if request completes
      
      if (!isMounted) {
        console.log('Component unmounted, skipping state updates');
        return; // Don't update state if component unmounted
      }
      
      if (result.success && result.pdfFiles) {
        console.log('Setting PDF files info:', result.pdfFiles);
        setPdfFilesInfo(result.pdfFiles);
        
        const pages: PageInfo[] = [];
        
        // Create page entries based on actual page count
        for (const pdfFile of result.pdfFiles) {
          for (let i = 1; i <= pdfFile.pageCount; i++) {
            pages.push({
              pageNumber: i,
              filename: pdfFile.filename,
            });
          }
        }
        
        console.log('Setting page previews:', pages);
        setPagePreviews(pages);
        
        // Generate real PDF thumbnails for each page
        if (isMounted) {
          console.log('Generating real PDF thumbnails...');
          await generateRealThumbnails(pages, isMounted);
        }
        
      } else {
        console.error('Failed to get PDF page information:', result.message);
        // Fallback to placeholder logic if backend fails
        const pages: PageInfo[] = [];
        pdfFiles.forEach(file => {
          const estimatedPages = Math.max(1, Math.floor(file.size / 50000));
          for (let i = 1; i <= estimatedPages; i++) {
            pages.push({
              pageNumber: i,
              filename: file.filename,
            });
          }
        });
        setPagePreviews(pages);
      }
    } catch (error) {
      console.error('Error generating page previews:', error);
      clearTimeout(timeoutId); // Clear timeout on error
      // Fallback to placeholder logic
      const pages: PageInfo[] = [];
      pdfFiles.forEach(file => {
        const estimatedPages = Math.max(1, Math.floor(file.size / 50000));
        for (let i = 1; i <= estimatedPages; i++) {
          pages.push({
            pageNumber: i,
            filename: file.filename,
          });
        }
      });
      setPagePreviews(pages);
    } finally {
      if (isMounted) {
        console.log('Setting isLoading to false');
        setIsLoading(false);
      }
    }
  };

  const generateRealThumbnails = async (pages: PageInfo[], isMounted: boolean) => {
    console.log('Generating real thumbnails for', pages.length, 'pages');
    
    for (let i = 0; i < pages.length; i++) {
      if (!isMounted) break;
      
      const page = pages[i];
      console.log('Processing thumbnail for', page.filename, 'page', page.pageNumber);
      
      try {
        // Get PDF file using API
        const result = await api.getPDFFile(page.filename);
        if (result.success && result.blob) {
          console.log('PDF file fetched successfully, size:', result.blob.size);
          
          const thumbnail = await generatePDFThumbnail(result.blob, page.pageNumber);
          
          if (isMounted && thumbnail) {
            console.log('Thumbnail generated successfully for page', page.pageNumber);
            setPagePreviews(prev => 
              prev.map(p => 
                p.filename === page.filename && p.pageNumber === page.pageNumber 
                  ? { ...p, thumbnail } 
                  : p
              )
            );
          } else {
            console.log('Failed to generate thumbnail for page', page.pageNumber);
            setThumbnailErrors(prev => [...prev, `Failed to generate thumbnail for ${page.filename} page ${page.pageNumber}`]);
          }
        } else {
          console.error('Failed to fetch PDF file:', result.message);
          setThumbnailErrors(prev => [...prev, `Failed to fetch PDF file: ${result.message}`]);
        }
      } catch (error) {
        console.error('Error generating thumbnail for', page.filename, 'page', page.pageNumber, ':', error);
        setThumbnailErrors(prev => [...prev, `Error processing ${page.filename} page ${page.pageNumber}: ${error}`]);
      }
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
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <Eye className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-xl">Page Preview</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Preview all pages from uploaded PDF files
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300">
              {pagePreviews.length} Pages
            </Badge>
            {onClose && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-muted/50 rounded-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
              <div>
                <p className="text-lg font-medium text-foreground mb-2">Generating previews...</p>
                <p className="text-muted-foreground">Processing PDF pages and creating real thumbnails</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {pagePreviews.map((page, index) => (
              <div
                key={`${page.filename}-${page.pageNumber}`}
                className="relative group cursor-pointer"
              >
                <div className="aspect-[3/4] bg-muted/30 rounded-lg border border-border/50 overflow-hidden hover:border-primary/50 transition-all duration-200 hover:shadow-md">
                  {page.thumbnail ? (
                    <div className="h-full w-full relative">
                      <img 
                        src={page.thumbnail} 
                        alt={`Page ${page.pageNumber} of ${page.filename}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          console.error('Failed to load thumbnail for page', page.pageNumber);
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      {/* Overlay with filename */}
                      <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-2 text-xs">
                        <div className="truncate">
                          {page.filename.length > 20 
                            ? `${page.filename.substring(0, 20)}...` 
                            : page.filename
                          }
                        </div>
                        <div>Page {page.pageNumber}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center p-4 text-center">
                      <div className="p-3 bg-muted/50 rounded-full mb-3">
                        <FileText className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div className="text-xs font-medium text-foreground mb-1">
                        {page.filename.length > 20 
                          ? `${page.filename.substring(0, 20)}...` 
                          : page.filename
                        }
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Page {page.pageNumber}
                      </div>
                      <div className="text-xs text-muted-foreground mt-2">
                        Loading thumbnail...
                      </div>
                    </div>
                  )}
                  
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                    <div className="p-2 bg-background/90 rounded-lg">
                      <Eye className="h-4 w-4 text-primary" />
                    </div>
                  </div>
                </div>
                
                {/* Page number badge */}
                <div className="absolute -top-2 -right-2">
                  <Badge variant="secondary" className="text-xs px-2 py-1">
                    {page.pageNumber}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Debug section */}
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
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="text-xs">
                  <Eye className="h-3 w-3 mr-1" />
                  View All
                </Button>
                <Button variant="outline" size="sm" className="text-xs">
                  <FileText className="h-3 w-3 mr-1" />
                  Export
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
