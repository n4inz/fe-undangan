'use client'
import { useState, useEffect } from 'react'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import axios from 'axios'
import GraphExpending from '@/components/graph-chart-js/GraphExpending'
import GraphPayment from '@/components/graph-chart-js/GraphPayment'
import GraphAnalysis from '@/components/graph-chart-js/GraphAnalysis'
import { ArrowUpCircle, ArrowDownCircle } from "lucide-react"
import { Skeleton } from '@/components/ui/skeleton'

// Format Rupiah
const formatRupiah = (val) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(val)

// Chart config
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
}

export default function Dashboard() {
  const [formData, setFormData] = useState([])
  const [incomeData, setIncomeData] = useState([])
  const [loading, setLoading] = useState({ form: true, income: true })
  const [totalIncome, setTotalIncome] = useState(null)

  // Fetch Form Statistics
  const fetchFormData = async () => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/count-form`, {
        withCredentials: true,
      })
      setFormData(response.data)
    } catch (err) {
      console.error("Gagal mengambil data form:", err)
      setFormData([])
    } finally {
      setLoading(prev => ({ ...prev, form: false }))
    }
  }

  // Fetch Income Statistics (Real API)
  const fetchIncomeData = async () => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/income-stats`, {
        withCredentials: true,
      })
      setIncomeData(response.data)
    } catch (err) {
      console.error("Gagal mengambil data pendapatan:", err)
      setIncomeData([])
    } finally {
      setLoading(prev => ({ ...prev, income: false }))
    }
  }

  // Fetch Total Income (new API)
  const fetchTotalIncome = async () => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/total-income`, {
        withCredentials: true,
      })
      setTotalIncome(response.data)
    } catch (err) {
      console.error("Gagal ambil total income:", err)
    }
  }

  // Format date range display
  const formatMonthYear = (dateString) => {
    if (!dateString) return ""
    const [year, month] = dateString.split("-")
    return new Date(parseInt(year), parseInt(month) - 1).toLocaleString('default', {
      month: 'long',
      year: 'numeric'
    })
  }

  const getDateRange = (data) => {
    if (data.length === 0) return "Belum ada data"
    return `${formatMonthYear(data[0]?.month)} - ${formatMonthYear(data[data.length - 1]?.month)}`
  }

  useEffect(() => {
    fetchFormData()
    fetchIncomeData()
    fetchTotalIncome()
  }, [])

  return (
    <div className="flex min-h-screen pt-10">
      {/* Sidebar (hidden on mobile) */}
      <div className="fixed md:relative z-40 w-64 h-full bg-gray-800 md:block hidden" />

      {/* Main Content */}
      <div className="flex flex-col flex-grow w-full md:pl-24">
        <div className="p-4 space-y-8">
          {/* New Top Card - Full Width */}
          <div className="w-full mb-8">
  <Card className="w-full">
    <CardContent className="flex flex-col md:flex-row items-start md:items-center justify-between w-full px-6 py-4 gap-4">
      
      {/* Bagian Kiri */}
      <div className="flex flex-col">
        {totalIncome ? (
          <>
            <CardTitle>Total Pendapatan</CardTitle>
            <CardDescription>
              {totalIncome.start} - {totalIncome.end}
            </CardDescription>
          </>
        ) : (
          <>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48 mt-2" />
          </>
        )}
      </div>

      {/* Bagian Kanan */}
      <div className="self-end md:self-auto">
        {totalIncome ? (
          <div
            className={`text-xl md:text-2xl font-bold flex items-center gap-2 ${
              totalIncome.totalIncome < 0 ? "text-red-600" : "text-green-600"
            }`}
          >
            {totalIncome.totalIncome < 0 ? (
              <ArrowDownCircle className="w-5 h-5 md:w-6 md:h-6" />
            ) : (
              <ArrowUpCircle className="w-5 h-5 md:w-6 md:h-6" />
            )}
            {formatRupiah(totalIncome.totalIncome)}
          </div>
        ) : (
          <Skeleton className="h-8 w-40" />
        )}
      </div>
    </CardContent>
  </Card>
</div>

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
                      <Bar
                        dataKey="form"
                        name="Jumlah Form"
                        fill="#2A9D90"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ChartContainer>
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
  )
}
