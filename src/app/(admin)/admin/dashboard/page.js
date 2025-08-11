'use client';
import { useState, useEffect } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import axios from 'axios';
import GraphExpending from '@/components/graph-chart-js/GraphExpending';
import GraphPayment from '@/components/graph-chart-js/GraphPayment';
import GraphAnalysis from '@/components/graph-chart-js/GraphAnalysis';

// Format Rupiah
const formatRupiah = (val) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);

// Add this above your Dashboard component
const chartConfig = {
  form: {
    label: 'Form Undangan',
    color: 'hsl(var(--chart-1))',
    theme: 'primary'
  },
  income: {
    label: 'Pendapatan',
    color: 'hsl(var(--chart-2))',
    theme: 'secondary'
  }
};

const Dashboard = () => {
  const [formData, setFormData] = useState([]);
  const [incomeData, setIncomeData] = useState([]);
  const [loading, setLoading] = useState({ form: true, income: true });

  // Fetch Form Statistics
  const fetchFormData = async () => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/count-form`, {
        withCredentials: true,
      });
      setFormData(response.data);
    } catch (err) {
      console.error("Gagal mengambil data form:", err);
      setFormData([]);
    } finally {
      setLoading(prev => ({ ...prev, form: false }));
    }
  };

  // Fetch Income Statistics (Real API)
  const fetchIncomeData = async () => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/income-stats`, {
        withCredentials: true,
      });
      setIncomeData(response.data);
    } catch (err) {
      console.error("Gagal mengambil data pendapatan:", err);
      setIncomeData([]);
    } finally {
      setLoading(prev => ({ ...prev, income: false }));
    }
  };

  // Format date range display
  const formatMonthYear = (dateString) => {
    if (!dateString) return "";
    const [year, month] = dateString.split("-");
    return new Date(year, month - 1).toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  const getDateRange = (data) => {
    if (data.length === 0) return "Belum ada data";
    return `${formatMonthYear(data[0]?.month)} - ${formatMonthYear(data[data.length - 1]?.month)}`;
  };

  useEffect(() => {
    fetchFormData();
    fetchIncomeData();
  }, []);

  return (
    <div className="flex min-h-screen pt-10">
      {/* Sidebar (hidden on mobile) */}
      <div className="fixed md:relative z-40 w-64 h-full bg-gray-800 md:block hidden" />

      {/* Main Content */}
      <div className="flex flex-col flex-grow w-full md:pl-24">
        <div className="p-4 space-y-8">
          {/* Dual Cards - Side by Side on Desktop */}
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Form Statistics Card */}
            <div className="flex-1">
              <Card>
                <CardHeader>
                  <CardTitle>Statistik Form Undangan</CardTitle>
                  <CardDescription>
                    {loading.form ? "Memuat data..." : getDateRange(formData)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading.form ? (
                    <div className="min-h-[300px] flex items-center justify-center">
                      <p>Memuat data form...</p>
                    </div>
                  ) : (
                    <ChartContainer config={chartConfig}>
                      <BarChart data={formData} margin={{ top: 20, bottom: 5 }}>
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <CartesianGrid vertical={false} strokeDasharray="3 3" />
                        <XAxis
                          dataKey="monthName"
                          tickFormatter={(value) => value?.slice(0, 3)}
                          tickLine={false}
                          axisLine={false}
                        />
                        {/* <YAxis width={80} /> */}
                        <Bar
                          dataKey="form"
                          name="Jumlah Form"
                          fill="#2A9D90"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ChartContainer>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Income Statistics Card */}
            <div className="flex-1">
              <Card>
                <CardHeader>
                  <CardTitle>Statistik Pembayaran Lunas</CardTitle>
                  <CardDescription>
                    {loading.income ? "Memuat data..." : getDateRange(incomeData)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading.income ? (
                    <div className="min-h-[300px] flex items-center justify-center">
                      <p>Memuat data pendapatan...</p>
                    </div>
                  ) : (
                    <ChartContainer config={chartConfig}>
                      <BarChart data={incomeData} margin={{ top: 20, bottom: 5 }}>
                        <ChartTooltip
                          content={<ChartTooltipContent formatter={(val) => formatRupiah(val)} />}
                        />
                        <CartesianGrid vertical={false} strokeDasharray="3 3" />
                        <XAxis
                          dataKey="monthName"
                          tickFormatter={(value) => value?.slice(0, 3)}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          tickFormatter={(value) => formatRupiah(value).replace('Rp', '').trim()} />
                        <Bar
                          dataKey="income"
                          name="Pendapatan"
                          fill="#4C7BF3"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ChartContainer>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Additional Graphs */}
          <div className="flex flex-wrap w-full">
            <div className="w-full lg:w-1/2 p-4">
              <GraphPayment />
            </div>
            <div className="w-full lg:w-1/2 p-4">
              <GraphExpending />
            </div>
            <div className="w-full p-4">
              <GraphAnalysis />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;