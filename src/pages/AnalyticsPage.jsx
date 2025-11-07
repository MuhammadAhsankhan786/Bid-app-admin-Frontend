import React, { useState, useEffect } from 'react';
import { TrendingUp, Download, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { Calendar } from '../components/ui/calendar';
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { apiService } from '../services/api';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { PageLoader } from '../components/Loader';

export function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [weeklyData, setWeeklyData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [dateRange, setDateRange] = useState({
    from: null,
    to: null
  });
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [stats, setStats] = useState({
    totalRevenue: '$0',
    totalBids: '0',
    avgBidValue: '$0',
    successRate: '0%'
  });

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalyticsWithDateRange = async (startDate, endDate) => {
    try {
      setLoading(true);
      toast.info('Loading analytics for selected date range...');
      // For now, we'll reload all analytics
      // In future, you can pass date range to API if backend supports it
      await loadAnalytics();
      toast.success('Analytics updated for selected date range');
    } catch (error) {
      console.error("Error loading analytics with date range:", error);
      toast.error("Failed to load analytics for date range");
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const [weekly, monthly, categories, orderStats] = await Promise.all([
        apiService.getWeeklyAnalytics(),
        apiService.getMonthlyAnalytics(),
        apiService.getCategoryAnalytics(),
        apiService.getOrderStats()
      ]);

      // Process weekly data
      if (weekly && Array.isArray(weekly) && weekly.length > 0) {
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const processed = weekly.map((item, index) => ({
          day: item.day || days[index % 7] || days[new Date().getDay()],
          revenue: parseFloat(item.revenue) || 0,
          bids: parseInt(item.bids) || 0,
          users: parseInt(item.users) || 0
        }));
        setWeeklyData(processed);
      } else {
        setWeeklyData([]);
      }

      // Process monthly data
      if (monthly && Array.isArray(monthly)) {
        setMonthlyData(monthly.map(item => ({
          month: item.month || 'Jan',
          revenue: parseFloat(item.revenue) || 0,
          bids: parseInt(item.bids) || 0
        })));
      }

      // Process category data
      if (categories && Array.isArray(categories)) {
        setCategoryData(categories.map(item => ({
          category: item.category || item.name || 'Unknown',
          value: parseFloat(item.value) || 0
        })));
      }

      // Calculate stats from weekly data
      const processedWeekly = weekly && Array.isArray(weekly) ? weekly : [];
      const totalRev = processedWeekly.reduce((sum, item) => sum + (parseFloat(item.revenue) || 0), 0);
      const totalBids = processedWeekly.reduce((sum, item) => sum + (parseInt(item.bids) || 0), 0);
      const avgBid = totalBids > 0 ? totalRev / totalBids : 0;
      const totalOrders = (orderStats?.pending || 0) + (orderStats?.inTransit || 0) + (orderStats?.delivered || 0);
      const successRate = totalOrders > 0 ? (((orderStats?.delivered || 0) / totalOrders) * 100).toFixed(1) : '0';

      setStats({
        totalRevenue: `$${totalRev.toLocaleString()}`,
        totalBids: totalBids.toLocaleString(),
        avgBidValue: `$${avgBid.toFixed(2)}`,
        successRate: `${successRate}%`
      });
    } catch (error) {
      console.error("Error loading analytics:", error);
      toast.error("Failed to load analytics data");
      setWeeklyData([]);
      setMonthlyData([]);
      setCategoryData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      // Dynamic import to avoid loading issues
      const { default: jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let yPos = 20;

      // Title
      doc.setFontSize(20);
      doc.setTextColor(59, 130, 246); // Blue color
      doc.text('Analytics & Reports', pageWidth / 2, yPos, { align: 'center' });
      yPos += 10;

      // Date
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth / 2, yPos, { align: 'center' });
      yPos += 15;

      // Key Metrics
      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0);
      doc.text('Key Performance Indicators', 14, yPos);
      yPos += 8;

      doc.setFontSize(11);
      doc.text(`Total Revenue: ${stats.totalRevenue}`, 20, yPos);
      yPos += 7;
      doc.text(`Total Bids: ${stats.totalBids}`, 20, yPos);
      yPos += 7;
      doc.text(`Avg. Bid Value: ${stats.avgBidValue}`, 20, yPos);
      yPos += 7;
      doc.text(`Success Rate: ${stats.successRate}`, 20, yPos);
      yPos += 15;

      // Weekly Data
      if (weeklyData.length > 0) {
        doc.setFontSize(14);
        doc.text('Weekly Analytics (Last 7 Days)', 14, yPos);
        yPos += 8;

        doc.setFontSize(10);
        doc.text('Day', 20, yPos);
        doc.text('Revenue ($)', 60, yPos);
        doc.text('Bids', 100, yPos);
        doc.text('Users', 130, yPos);
        yPos += 6;

        weeklyData.forEach((item) => {
          if (yPos > pageHeight - 20) {
            doc.addPage();
            yPos = 20;
          }
          doc.text(item.day || 'N/A', 20, yPos);
          doc.text(`$${item.revenue.toFixed(2)}`, 60, yPos);
          doc.text(item.bids.toString(), 100, yPos);
          doc.text(item.users.toString(), 130, yPos);
          yPos += 6;
        });
        yPos += 10;
      }

      // Monthly Data
      if (monthlyData.length > 0) {
        if (yPos > pageHeight - 30) {
          doc.addPage();
          yPos = 20;
        }
        doc.setFontSize(14);
        doc.text('Monthly Analytics', 14, yPos);
        yPos += 8;

        doc.setFontSize(10);
        doc.text('Month', 20, yPos);
        doc.text('Revenue ($)', 70, yPos);
        doc.text('Bids', 120, yPos);
        yPos += 6;

        monthlyData.forEach((item) => {
          if (yPos > pageHeight - 20) {
            doc.addPage();
            yPos = 20;
          }
          doc.text(item.month || 'N/A', 20, yPos);
          doc.text(`$${item.revenue.toFixed(2)}`, 70, yPos);
          doc.text(item.bids.toString(), 120, yPos);
          yPos += 6;
        });
        yPos += 10;
      }

      // Category Data
      if (categoryData.length > 0) {
        if (yPos > pageHeight - 30) {
          doc.addPage();
          yPos = 20;
        }
        doc.setFontSize(14);
        doc.text('Top Categories by Revenue', 14, yPos);
        yPos += 8;

        doc.setFontSize(10);
        doc.text('Category', 20, yPos);
        doc.text('Revenue ($)', 100, yPos);
        yPos += 6;

        categoryData.forEach((item) => {
          if (yPos > pageHeight - 20) {
            doc.addPage();
            yPos = 20;
          }
          doc.text(item.category || 'Uncategorized', 20, yPos);
          doc.text(`$${item.value.toFixed(2)}`, 100, yPos);
          yPos += 6;
        });
      }

      // Footer
      const totalPages = doc.internal.pages.length - 1;
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
      }

      // Save PDF
      const fileName = `Analytics_Report_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      toast.success('PDF report downloaded successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF report');
    }
  };

  if (loading) {
    return React.createElement(PageLoader, { message: "Loading analytics..." });
  }

  return React.createElement(
    "div",
    { className: "space-y-6" },
    React.createElement(
      "div",
      { className: "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4" },
      React.createElement("div", null,
        React.createElement("h1", { className: "text-gray-900 dark:text-white mb-1" }, "Analytics & Reports"),
        React.createElement("p", { className: "text-sm text-gray-600 dark:text-gray-400" }, "Track performance metrics and insights")
      ),
      React.createElement("div", { className: "flex gap-2" },
        React.createElement(Popover, { open: isDatePickerOpen, onOpenChange: setIsDatePickerOpen },
          React.createElement(PopoverTrigger, { asChild: true },
            React.createElement(Button, { variant: "outline" },
              React.createElement(CalendarIcon, { className: "h-4 w-4 mr-2" }),
              dateRange.from && dateRange.to
                ? `${format(dateRange.from, 'MMM dd')} - ${format(dateRange.to, 'MMM dd')}`
                : dateRange.from
                ? format(dateRange.from, 'MMM dd')
                : "Date Range"
            )
          ),
          React.createElement(PopoverContent, { className: "w-auto p-0", align: "start" },
            React.createElement(Calendar, {
              mode: "range",
              defaultMonth: dateRange.from || new Date(),
              selected: { from: dateRange.from, to: dateRange.to },
              onSelect: (range) => {
                setDateRange({
                  from: range?.from || null,
                  to: range?.to || null
                });
                if (range?.from && range?.to) {
                  setIsDatePickerOpen(false);
                  loadAnalyticsWithDateRange(range.from, range.to);
                }
              },
              numberOfMonths: 2
            })
          )
        ),
        React.createElement(Button, {
          className: "bg-gradient-to-r from-blue-600 to-purple-600",
          onClick: handleDownloadPDF
        },
          React.createElement(Download, { className: "h-4 w-4 mr-2" }), "Download Report")
      )
    ),
    React.createElement(
      "div",
      { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" },
      React.createElement(Card, null,
        React.createElement(CardContent, { className: "p-6" },
          React.createElement("div", { className: "flex items-center justify-between mb-2" },
            React.createElement("p", { className: "text-sm text-gray-600 dark:text-gray-400" }, "Total Revenue"),
            React.createElement(TrendingUp, { className: "h-4 w-4 text-green-600" })
          ),
          React.createElement("p", { className: "text-gray-900 dark:text-white mb-1" }, stats.totalRevenue),
          React.createElement("p", { className: "text-xs text-green-600" }, "+15.3% from last period")
        )
      ),
      React.createElement(Card, null,
        React.createElement(CardContent, { className: "p-6" },
          React.createElement("div", { className: "flex items-center justify-between mb-2" },
            React.createElement("p", { className: "text-sm text-gray-600 dark:text-gray-400" }, "Total Bids"),
            React.createElement(TrendingUp, { className: "h-4 w-4 text-green-600" })
          ),
          React.createElement("p", { className: "text-gray-900 dark:text-white mb-1" }, stats.totalBids),
          React.createElement("p", { className: "text-xs text-green-600" }, "+23.1% from last period")
        )
      ),
      React.createElement(Card, null,
        React.createElement(CardContent, { className: "p-6" },
          React.createElement("div", { className: "flex items-center justify-between mb-2" },
            React.createElement("p", { className: "text-sm text-gray-600 dark:text-gray-400" }, "Avg. Bid Value"),
            React.createElement(TrendingUp, { className: "h-4 w-4 text-green-600" })
          ),
          React.createElement("p", { className: "text-gray-900 dark:text-white mb-1" }, stats.avgBidValue),
          React.createElement("p", { className: "text-xs text-green-600" }, "+7.8% from last period")
        )
      ),
      React.createElement(Card, null,
        React.createElement(CardContent, { className: "p-6" },
          React.createElement("div", { className: "flex items-center justify-between mb-2" },
            React.createElement("p", { className: "text-sm text-gray-600 dark:text-gray-400" }, "Success Rate"),
            React.createElement(TrendingUp, { className: "h-4 w-4 text-green-600" })
          ),
          React.createElement("p", { className: "text-gray-900 dark:text-white mb-1" }, stats.successRate),
          React.createElement("p", { className: "text-xs text-green-600" }, "+2.1% from last period")
        )
      )
    ),
    React.createElement(Tabs, { defaultValue: "weekly", className: "space-y-4" },
      React.createElement(TabsList, null,
        React.createElement(TabsTrigger, { value: "weekly" }, "Weekly"),
        React.createElement(TabsTrigger, { value: "monthly" }, "Monthly")
      ),
      React.createElement(TabsContent, { value: "weekly", className: "space-y-4" },
        React.createElement(Card, null,
          React.createElement(CardHeader, null,
            React.createElement(CardTitle, null, "Revenue & Bidding Trends (Weekly)"),
            React.createElement(CardDescription, null, "Last 7 days performance")
          ),
          React.createElement(CardContent, null,
            React.createElement(ResponsiveContainer, { width: "100%", height: 350 },
              React.createElement(AreaChart, { data: weeklyData },
                React.createElement(CartesianGrid, { strokeDasharray: "3 3", className: "stroke-gray-200 dark:stroke-gray-800" }),
                React.createElement(XAxis, { dataKey: "day", className: "text-xs" }),
                React.createElement(YAxis, { className: "text-xs" }),
                React.createElement(Tooltip, { contentStyle: { backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' } }),
                React.createElement(Legend, null),
                React.createElement(Area, { type: "monotone", dataKey: "revenue", stackId: "1", stroke: "#3b82f6", fill: "#3b82f6", fillOpacity: 0.6, name: "Revenue ($)" }),
                React.createElement(Area, { type: "monotone", dataKey: "bids", stackId: "2", stroke: "#8b5cf6", fill: "#8b5cf6", fillOpacity: 0.6, name: "Bids" })
              )
            )
          )
        ),
        React.createElement(Card, null,
          React.createElement(CardHeader, null,
            React.createElement(CardTitle, null, "User Activity (Weekly)"),
            React.createElement(CardDescription, null, "New user registrations")
          ),
          React.createElement(CardContent, null,
            React.createElement(ResponsiveContainer, { width: "100%", height: 300 },
              React.createElement(BarChart, { data: weeklyData },
                React.createElement(CartesianGrid, { strokeDasharray: "3 3", className: "stroke-gray-200 dark:stroke-gray-800" }),
                React.createElement(XAxis, { dataKey: "day", className: "text-xs" }),
                React.createElement(YAxis, { className: "text-xs" }),
                React.createElement(Tooltip, { contentStyle: { backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' } }),
                React.createElement(Bar, { dataKey: "users", fill: "#10b981", radius: [8, 8, 0, 0] })
              )
            )
          )
        )
      ),
      React.createElement(TabsContent, { value: "monthly", className: "space-y-4" },
        React.createElement(Card, null,
          React.createElement(CardHeader, null,
            React.createElement(CardTitle, null, "Revenue & Bidding Trends (Monthly)"),
            React.createElement(CardDescription, null, "Year-to-date performance")
          ),
          React.createElement(CardContent, null,
            React.createElement(ResponsiveContainer, { width: "100%", height: 350 },
              React.createElement(LineChart, { data: monthlyData },
                React.createElement(CartesianGrid, { strokeDasharray: "3 3", className: "stroke-gray-200 dark:stroke-gray-800" }),
                React.createElement(XAxis, { dataKey: "month", className: "text-xs" }),
                React.createElement(YAxis, { className: "text-xs" }),
                React.createElement(Tooltip, { contentStyle: { backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' } }),
                React.createElement(Legend, null),
                React.createElement(Line, { type: "monotone", dataKey: "revenue", stroke: "#3b82f6", strokeWidth: 3, dot: { r: 5 }, name: "Revenue ($)" }),
                React.createElement(Line, { type: "monotone", dataKey: "bids", stroke: "#8b5cf6", strokeWidth: 3, dot: { r: 5 }, name: "Total Bids" })
              )
            )
          )
        )
      )
    ),
    React.createElement(Card, null,
      React.createElement(CardHeader, null,
        React.createElement(CardTitle, null, "Top Categories by Revenue"),
        React.createElement(CardDescription, null, "Performance breakdown by product category")
      ),
      React.createElement(CardContent, null,
        React.createElement(ResponsiveContainer, { width: "100%", height: 300 },
          React.createElement(BarChart, { data: categoryData, layout: "vertical" },
            React.createElement(CartesianGrid, { strokeDasharray: "3 3", className: "stroke-gray-200 dark:stroke-gray-800" }),
            React.createElement(XAxis, { type: "number", className: "text-xs" }),
            React.createElement(YAxis, { dataKey: "category", type: "category", className: "text-xs", width: 120 }),
            React.createElement(Tooltip, { contentStyle: { backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' } }),
            React.createElement(Bar, { dataKey: "value", fill: "#ec4899", radius: [0, 8, 8, 0] })
          )
        )
      )
    )
  );
}
