'use client';
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const Gallery = () => {
  const [years, setYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState(null);
  const [monthData, setMonthData] = useState({});
  const [yearTotals, setYearTotals] = useState({});
  const [imageData, setImageData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isMonthDialogOpen, setIsMonthDialogOpen] = useState(false);
  const [isUncompressedDialogOpen, setIsUncompressedDialogOpen] = useState(false);
  const [uncompressedCount, setUncompressedCount] = useState(0);

  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      try {
        const [imageResponse, uncompressedResponse] = await Promise.all([
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/get-image-data`, { withCredentials: true }),
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/get-uncompressed-data`, { withCredentials: true }),
        ]);
        const { imageData: fetchedData, yearTotals: newYearTotals } = imageResponse.data;
        const { uncompressedCount: newUncompressedCount } = uncompressedResponse.data;

        setImageData(fetchedData);
        setYearTotals(newYearTotals || {});
        setUncompressedCount(newUncompressedCount);

        const allYears = Object.keys(newYearTotals || {}).map(Number);
        const minYear = Math.min(...allYears);
        const maxYear = Math.max(...allYears);
        const yearRange = Array.from({ length: maxYear - minYear + 1 }, (_, i) => minYear + i);
        setYears(yearRange);

        const initialYear = yearRange[0];
        setSelectedYear(initialYear);
      } catch (error) {
        console.error('Error fetching data:', error.response?.data || error.message);
        toast({ title: "Error", description: "Failed to fetch data. Check authentication." });
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  useEffect(() => {
    if (!selectedYear || !imageData[selectedYear]) return;

    const newMonthData = {};
    months.forEach(month => {
      newMonthData[month] = imageData[selectedYear]?.[month] || 0;
    });
    setMonthData(newMonthData);
  }, [selectedYear, imageData]);

const handleDeleteMonth = useCallback(async () => {
  if (!selectedMonth || !selectedYear) return;

  setIsDeleting(true);
  try {
    const response = await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/delete-month-images?year=${selectedYear}&month=${selectedMonth}`, {
      withCredentials: true,
    });
    console.log('Delete response:', response.data);
    toast({ title: "Success", description: `All images in ${selectedMonth} ${selectedYear} deleted` });

    const [refreshImageResponse, refreshUncompressedResponse] = await Promise.all([
      axios.get(`${process.env.NEXT_PUBLIC_API_URL}/get-image-data`, { withCredentials: true }),
      axios.get(`${process.env.NEXT_PUBLIC_API_URL}/get-uncompressed-data`, { withCredentials: true }),
    ]);
    const { imageData: fetchedData, yearTotals: newYearTotals } = refreshImageResponse.data;
    const { uncompressedCount: newUncompressedCount } = refreshUncompressedResponse.data;

    setImageData(fetchedData);
    setYearTotals(newYearTotals || {});
    setUncompressedCount(newUncompressedCount);

    const newMonthData = { ...monthData };
    const selectedYearData = fetchedData[selectedYear] || {};
    months.forEach(month => {
      newMonthData[month] = selectedYearData[month] || 0;
    });
    setMonthData(newMonthData);
    setSelectedMonth(null);
  } catch (error) {
    console.error('Error deleting images:', error.response?.data || error.message);
    toast({ title: "Error", description: `Failed to delete images: ${error.response?.data?.error || error.message}` });
  } finally {
    setIsDeleting(false);
    setIsMonthDialogOpen(false);
  }
}, [selectedMonth, selectedYear, monthData]);

  const handleDeleteUncompressedFiles = useCallback(async () => {
    setIsDeleting(true);
    try {
      const response = await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/delete-uncompressed-files`, {
        withCredentials: true,
      });
      console.log('Delete uncompressed response:', response.data);
      toast({ title: "Success", description: response.data.message });

      const uncompressedResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/get-uncompressed-data`, {
        withCredentials: true,
      });
      setUncompressedCount(uncompressedResponse.data.uncompressedCount);
    } catch (error) {
      console.error('Error deleting uncompressed files:', error.response?.data || error.message);
      toast({ title: "Error", description: `Failed to delete uncompressed files: ${error.response?.data?.error || error.message}` });
    } finally {
      setIsDeleting(false);
      setIsUncompressedDialogOpen(false);
    }
  }, []);

  return (
    <>
      <div className="h-10 fixed bg-white border-b w-full"></div>
      <div className="flex min-h-screen pt-10">
        <div className="fixed md:relative z-40 w-64 h-full bg-gray-800 md:block hidden"></div>
        <div className="flex flex-col flex-grow w-full md:pl-24">
          <div className="p-4">
            <div className="py-4">Gallery</div>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-2 space-y-2">
                {isLoading
                  ? Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full rounded-md" />
                  ))
                  : <>
                    {years.slice().reverse().map((year) => (
                      <Button
                        key={year}
                        variant={selectedYear === year ? "default" : "outline"}
                        onClick={() => setSelectedYear(year)}
                        className="w-full justify-between"
                      >
                        {year}
                        <span className="bg-blue-500 text-white text-xs font-semibold px-2 py-1 rounded-full ml-2">
                          {yearTotals[year] || 0} {yearTotals[year] <= 1 ? 'image' : 'images'}
                        </span>
                      </Button>
                    ))}
                    <AlertDialog open={isUncompressedDialogOpen} onOpenChange={setIsUncompressedDialogOpen}>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-between mt-2"
                        >
                          Uncompressed
                          <span className="bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded-full ml-2">
                            {uncompressedCount} {uncompressedCount <= 1 ? 'file' : 'files'}
                          </span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete all {uncompressedCount} uncompressed file(s)?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleDeleteUncompressedFiles}
                            disabled={isDeleting}
                          >
                            {isDeleting ? 'Deleting...' : 'Yes'}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    {/* Peringatan merah di bawah pilihan */}
                  </>
                }
              </div>
              <div className="md:col-span-10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4">
                {isLoading
                  ? Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="h-10 w-full bg-gray-200 animate-pulse rounded-md" />
                  ))
                  : months
                    .filter(month => monthData[month] > 0)
                    .map((month) => (
                      <AlertDialog key={month} open={isMonthDialogOpen && selectedMonth === month} onOpenChange={(open) => {
                        setIsMonthDialogOpen(open);
                        if (!open) setSelectedMonth(null);
                      }}>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-between"
                            onClick={() => {
                              setSelectedMonth(month);
                              setIsMonthDialogOpen(true);
                            }}
                          >
                            {month}
                            <span className="bg-blue-500 text-white text-xs font-semibold px-2 py-1 rounded-full ml-2">
                              {monthData[month]} {monthData[month] <= 1 ? 'image' : 'images'}
                            </span>
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete all photos in {month} {selectedYear}?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleDeleteMonth}
                              disabled={isDeleting}
                            >
                              {isDeleting ? 'Deleting...' : 'Yes'}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    ))}
              </div>
            </div>
          </div>
          <div className="text-red-600 text-center font-bold mt-2">
            Peringatan: Hapus file dengan hati-hati!
          </div>
        </div>
      </div>
      {isDeleting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded shadow-lg">
            <p className="text-lg">Deleting files, please wait...</p>
          </div>
        </div>
      )}
    </>
  );
};

export default Gallery;