'use client';
import { useState, useEffect } from 'react';

import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
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

const chartConfig = {
  form: {
    label: "Form",
    color: "hsl(var(--chart-1))",
  },
};

// Add state to manage dynamic content and for the new line graph

const Dashboard = () => {
  const [isClient, setIsClient] = useState(false);

  // State for the existing bar chart
  const [chartData, setChartData] = useState([]);

  const fetchData = async () => {
    const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/count-form`, {
      withCredentials: true, // Include credentials (cookies, authentication) with the request
  });
    setChartData(response.data);
  };


  const formatMonthYear = (dateString) => {
    const [year, month] = dateString.split("-");
    return new Date(year, month - 1).toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  useEffect(() => {
    setIsClient(true);
    fetchData();
  }, []); // Re-fetch expending data when range or periods change

  return (
    <>
      <div className="h-10 fixed bg-white border-b w-full"></div>
      <div className="flex min-h-screen pt-10">
        <div className="fixed md:relative z-40 w-64 h-full bg-gray-800 md:block hidden">
          {/* <Sidebar /> */}
        </div>

        {/* Main Content */}
        <div className="flex flex-col flex-grow w-full md:pl-24">
          <div className="p-4">
            {/* Bar Chart */}
            <div className="w-full lg:w-1/2 mb-8">
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
                        fill="#2A9D90"
                        radius={[0, 0, 4, 4]}
                      />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>

            {/* Line Chart for Expending Data */}
            <div className="flex flex-wrap w-full">
              {/* GraphPayment: Takes full width on small screens, half on large screens */}
              <div className="w-full lg:w-1/2 p-4"> {/* Add padding to create spacing between components */}
                <GraphPayment />
              </div>

              {/* GraphExpending: Takes full width on small screens, half on large screens */}
              <div className="w-full lg:w-1/2 p-4"> {/* Add padding to create spacing between components */}
                <GraphExpending />
              </div>
              <div className="w-full p-4"> {/* Add padding to create spacing between components */}
                <GraphAnalysis />
              </div>
            </div>


          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
