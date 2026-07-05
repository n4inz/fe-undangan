'use client'
import { useState, useEffect, useMemo } from 'react'
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
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import axios from 'axios'
import { useRouter } from 'next/navigation'
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

const getTooltipTotal = (payload) =>
  payload.reduce(
    (total, item) => total + (Number(item.value) || 0),
    0
  )

// Chart config
const chartConfig = {
  form: {
    label: 'Form Wedding',
    color: 'hsl(var(--chart-1))',
    theme: 'primary'
  },
  aqiqahKhitanForm: {
    label: 'Form Aqiqah / Khitan',
    color: '#F59E0B',
    theme: 'secondary'
  },
  income: {
    label: 'Pembayaran Wedding',
    color: 'hsl(var(--chart-2))',
    theme: 'secondary'
  },
  aqiqahKhitanIncome: {
    label: 'Pembayaran Aqiqah / Khitan',
    color: '#F59E0B',
    theme: 'secondary'
  }
}

const mergeMonthlyData = (
  weddingData,
  aqiqahKhitanData,
  weddingKey,
  aqiqahKhitanKey
) => {
  const monthlyData = new Map()

  weddingData.forEach((item) => {
    monthlyData.set(item.month, {
      ...item,
      [weddingKey]: Number(item[weddingKey] || 0),
      [aqiqahKhitanKey]: 0,
    })
  })

  aqiqahKhitanData.forEach((item) => {
    const current = monthlyData.get(item.month) || {
      month: item.month,
      monthName: item.monthName,
      [weddingKey]: 0,
    }

    monthlyData.set(item.month, {
      ...current,
      monthName: current.monthName || item.monthName,
      [aqiqahKhitanKey]: Number(item[weddingKey] || 0),
    })
  })

  return Array.from(monthlyData.values()).sort((first, second) =>
    first.month.localeCompare(second.month)
  )
}

export default function Dashboard() {
  const router = useRouter()
  const [formData, setFormData] = useState([])
  const [incomeData, setIncomeData] = useState([])
  const [aqiqahKhitanStats, setAqiqahKhitanStats] = useState({
    formStats: [],
    incomeStats: [],
  })
  const [loading, setLoading] = useState({
    form: true,
    income: true,
    aqiqahKhitan: true,
  })
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

  const fetchAqiqahKhitanStats = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/forms/aqiqah-khitan/statistics`,
        { withCredentials: true }
      )
      setAqiqahKhitanStats({
        formStats: response.data?.formStats || [],
        incomeStats: response.data?.incomeStats || [],
      })
    } catch (err) {
      console.error("Gagal mengambil statistik Aqiqah/Khitan:", err)
      setAqiqahKhitanStats({ formStats: [], incomeStats: [] })
    } finally {
      setLoading(prev => ({ ...prev, aqiqahKhitan: false }))
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

  // Helper format singkat
  const formatShortNumber = (num) => {
    if (num >= 1_000_000) {
      return (num / 1_000_000).toFixed(1).replace('.0', '') + ' jt'
    } else if (num >= 1_000) {
      return (num / 1_000).toFixed(0) + ' rb'
    }
    return num
  }

  const combinedFormData = useMemo(
    () =>
      mergeMonthlyData(
        formData,
        aqiqahKhitanStats.formStats,
        'form',
        'aqiqahKhitanForm'
      ),
    [aqiqahKhitanStats.formStats, formData]
  )

  const combinedIncomeData = useMemo(
    () =>
      mergeMonthlyData(
        incomeData,
        aqiqahKhitanStats.incomeStats,
        'income',
        'aqiqahKhitanIncome'
      ),
    [aqiqahKhitanStats.incomeStats, incomeData]
  )


  useEffect(() => {
    const verifyAdmin = async () => {
      try {
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/cek-role`, {
          withCredentials: true,
        });

        if (res.data.isAdmin !== 1) {
          router.push("/admin/list");
          return;
        }

        fetchFormData();
        fetchIncomeData();
        fetchAqiqahKhitanStats();
        fetchTotalIncome();
      } catch (error) {
        console.error("Error verifying admin status:", error);
        router.push("/login");
      }
    };

    verifyAdmin();
  }, [router])

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
                <div className="self-start md:self-auto">
                  {totalIncome ? (
                    <div
                      className={`text-xl md:text-2xl font-bold flex items-center gap-2 ${totalIncome.totalIncome < 0 ? "text-red-600" : "text-green-600"
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
                    {loading.form || loading.aqiqahKhitan
                      ? "Memuat data..."
                      : getDateRange(combinedFormData)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig}>
                    <BarChart data={combinedFormData} margin={{ top: 20, bottom: 5 }}>
                      <ChartTooltip
                        content={
                          <ChartTooltipContent
                            footer={(payload) => (
                              <div className="mt-1 flex items-center justify-between gap-4 border-t pt-2 font-semibold">
                                <span>Total Form</span>
                                <span className="font-mono tabular-nums">
                                  {getTooltipTotal(payload).toLocaleString('id-ID')}
                                </span>
                              </div>
                            )}
                          />
                        }
                      />
                      <CartesianGrid vertical={false} strokeDasharray="3 3" />
                      <XAxis
                        dataKey="monthName"
                        tickFormatter={(value) => value?.slice(0, 3)}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Bar
                        dataKey="form"
                        name="Form Wedding"
                        fill="#2A9D90"
                        stackId="form-total"
                      />
                      <Bar
                        dataKey="aqiqahKhitanForm"
                        name="Form Aqiqah / Khitan"
                        fill="#F59E0B"
                        stackId="form-total"
                        radius={[4, 4, 0, 0]}
                      />
                      <ChartLegend content={<ChartLegendContent />} />
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
                    {loading.income || loading.aqiqahKhitan
                      ? "Memuat data..."
                      : getDateRange(combinedIncomeData)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig}>
                    <BarChart data={combinedIncomeData} margin={{ top: 20, bottom: 5 }}>
                      <ChartTooltip
                        content={
                          <ChartTooltipContent
                            formatter={(value, name) => (
                              <div className="flex min-w-48 flex-1 items-center justify-between gap-4">
                                <span className="text-muted-foreground">
                                  {name}
                                </span>
                                <span className="font-mono font-medium tabular-nums text-foreground">
                                  {formatRupiah(value)}
                                </span>
                              </div>
                            )}
                            footer={(payload) => (
                              <div className="mt-1 flex items-center justify-between gap-4 border-t pt-2 font-semibold">
                                <span>Total Pembayaran</span>
                                <span className="font-mono tabular-nums">
                                  {formatRupiah(getTooltipTotal(payload))}
                                </span>
                              </div>
                            )}
                          />
                        }
                      />
                      <CartesianGrid vertical={false} strokeDasharray="3 3" />
                      <XAxis
                        dataKey="monthName"
                        tickFormatter={(value) => value?.slice(0, 3)}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis tickFormatter={(value) => formatShortNumber(value)} />
                      <Bar
                        dataKey="income"
                        name="Pembayaran Wedding"
                        fill="#4C7BF3"
                        stackId="income-total"
                      />
                      <Bar
                        dataKey="aqiqahKhitanIncome"
                        name="Pembayaran Aqiqah / Khitan"
                        fill="#F59E0B"
                        stackId="income-total"
                        radius={[4, 4, 0, 0]}
                      />
                      <ChartLegend content={<ChartLegendContent />} />
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
