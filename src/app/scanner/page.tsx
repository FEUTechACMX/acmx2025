import { useState, useCallback } from 'react';
import { ScanType, ScanData } from '@/types/scanner';
import { ScanTypeSelector } from '@/components/scanner/ScanTypeSelector';
import { QRScanner } from '@/components/scanner/QRScanner';
import { ScanDetailsForm } from '@/components/scanner/ScanDetailsForm';
import { simulateScan } from '@/lib/mockData';
import { Scan } from 'lucide-react';

const Index = () => {
  const [scanType, setScanType] = useState<ScanType>('task');
  const [isScanning, setIsScanning] = useState(false);
  const [scannedData, setScannedData] = useState<ScanData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleScan = useCallback(async (result: string) => {
    setIsScanning(false);
    setIsLoading(true);
    
    try {
      const data = await simulateScan(result);
      setScannedData(data);
    } catch (error) {
      console.error('Scan error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleReset = () => {
    setScannedData(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b">
        <div className="container max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <Scan className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">SCANNER</h1>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Core Vertex</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container max-w-6xl mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Scanner */}
          <div className="space-y-4">
            <div className="relative">
              {isLoading && (
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-2xl">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm font-medium">Processing...</p>
                  </div>
                </div>
              )}
              <QRScanner
                onScan={handleScan}
                isScanning={isScanning}
                onToggleScanning={() => setIsScanning(!isScanning)}
              />
            </div>
            
            {/* Scan Type Selector - Below Upload */}
            <ScanTypeSelector 
              selectedType={scanType} 
              onTypeChange={(type) => {
                setScanType(type);
                setScannedData(null);
              }} 
            />
          </div>

          {/* Right Column - Details (Always visible) */}
          <div>
            <ScanDetailsForm
              scanType={scanType}
              scannedData={scannedData}
              onReset={handleReset}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
