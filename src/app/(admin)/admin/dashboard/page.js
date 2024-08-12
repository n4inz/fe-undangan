'use client';
import { useState, useEffect } from 'react'

import Sidebar from "@/layout/sidebar";
import { TrendingUp } from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import axios from 'axios';

const chartData = [
  // { month: "January", desktop: 186, mobile: 80 },
  // { month: "February", desktop: 305, mobile: 200 },
  // { month: "March", desktop: 237, mobile: 120 },
  // { month: "April", desktop: 73, mobile: 190 },
  // { month: "May", desktop: 209, mobile: 130 },
  // { month: "June", desktop: 214, mobile: 140 },
  // { month: "July", desktop: 250, mobile: 160 },
  // { month: "August", desktop: 300, mobile: 180 },
  // { month: "September", desktop: 220, mobile: 140 },
  // { month: "October", desktop: 270, mobile: 200 },
  // { month: "November", desktop: 310, mobile: 220 },
  // { month: "December", desktop: 400, mobile: 300 },
]

const chartConfig = {
  form: {
    label: "Form",
    color: "hsl(var(--chart-1))",
  },
  // mobile: {
  //   label: "Mobile",
  //   color: "hsl(var(--chart-2))",
  // },
}

// Use state to manage dynamic content


const Dashboard = () => {

  const [isClient, setIsClient] = useState(false)

  const [chartData, setChartData] = useState([])
  const fetchData = async () => {
    const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/count-form`)

    setChartData(response.data)

  }

  const formatMonthYear = (dateString) => {
    const [year, month] = dateString.split("-");
    return new Date(year, month - 1).toLocaleString('default', { month: 'long', year: 'numeric' });
  }

  useEffect(() => {
    setIsClient(true)
    fetchData()
  }, [])

  return (
    <>
      <div className="h-10 fixed z-50 bg-white border-b w-full"></div>
      <div className="flex min-h-screen pt-10">
        {/* Sidebar */}
        <div className="fixed md:relative z-40 w-64 h-full bg-gray-800 md:block hidden">
          <Sidebar />
        </div>

        {/* Main Content */}
        <div className="flex flex-col flex-grow w-full md:pl-24">
          <div className="p-4">
            <div className="w-1/2">
              <Card>
                <CardHeader>
                  <CardTitle>Statistik Form Undangan</CardTitle>
                  <CardDescription>
                  {chartData.length > 0 ? `${formatMonthYear(chartData[0].month)} - ${formatMonthYear(chartData[chartData.length - 1].month)}` : "Loading..."}
                </CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig}>
                    <BarChart accessibilityLayer data={chartData}>
                    <ChartTooltip content={<ChartTooltipContent year={chartData.month} />} />
                      <CartesianGrid vertical={false} />
                      <XAxis
                        dataKey="monthName"
                        tickLine={false}
                        tickMargin={10}
                        axisLine={false}
                        tickFormatter={(value) => value.slice(0, 3)}
                      />
                      <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                      <ChartLegend content={<ChartLegendContent />} />
                      <Bar
                        dataKey="form"
                        stackId="a"
                        fill="var(--color-form)"
                        radius={[0, 0, 4, 4]}
                      />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
                <CardFooter className="flex-col items-start gap-2 text-sm">
                  {/* <div className="flex gap-2 font-medium leading-none">
                    Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
                  </div>
                  <div className="leading-none text-muted-foreground">
                    Showing total visitors for the last 6 months
                  </div> */}
                </CardFooter>
              </Card>

            </div>
          </div>
        </div>
      </div>
    </>
  );


}

export default Dashboard;


