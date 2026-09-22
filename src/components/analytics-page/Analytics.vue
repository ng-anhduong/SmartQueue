<template>
  <div class="analytics-chart">
    <h2 id="graph-title">Popular Times for {{ serviceLabel }}</h2>

    <div class="days">
      <span
        v-for="day in days"
        :key="day.label"
        :class="{ active: selectedDay === day.value }"
        @click="selectDay(day.value)"
      >
        {{ day.label }}
      </span>
    </div>

    <div v-if="loading" class="loading">Loading...</div>

    <template v-else>
      <div v-if="selectedDay === 0" class="closed-message">
        Closed on Sunday
      </div>
      <column-chart
        v-else
        :data="chartData"
        :dataset="chartDataset"
        :library="chartOptions"
        height="280px"
      />
    </template>
  </div>
</template>

<script>
import { useRoute } from "vue-router";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/firebase";

export default {
  setup() {
    const route = useRoute();
    return {
      branchId: route.params.branchId,
      serviceType: route.query.service ?? "General",
    };
  },

  data() {
    return {
      selectedDay: new Date().getDay(),
      days: [
        { label: "MON", value: 1 },
        { label: "TUE", value: 2 },
        { label: "WED", value: 3 },
        { label: "THU", value: 4 },
        { label: "FRI", value: 5 },
        { label: "SAT", value: 6 },
        { label: "SUN", value: 0 },
      ],
      allTickets: [],
      loading: true,
    };
  },

  computed: {
    serviceLabel() {
      const labels = {
        General: "General Services",
        Account: "Account Services",
        Loan: "Loan Services",
      };
      return labels[this.serviceType] ?? this.serviceType;
    },

    timeSlots() {
      return [
        {
          startMinutes: 8 * 60 + 30,
          endMinutes: 10 * 60,
          label: "8:30 - 10:00",
        },
        {
          startMinutes: 10 * 60,
          endMinutes: 11 * 60 + 30,
          label: "10:00 - 11:30",
        },
        {
          startMinutes: 11 * 60 + 30,
          endMinutes: 13 * 60,
          label: "11:30 - 1:00",
        },
        {
          startMinutes: 13 * 60,
          endMinutes: 14 * 60 + 30,
          label: "1:00 - 2:30",
        },
        {
          startMinutes: 14 * 60 + 30,
          endMinutes: 16 * 60,
          label: "2:30 - 4:00",
        },
      ];
    },

    observedDateRange() {
      const validDates = this.allTickets
        .map((t) => t.joinedAt?.toDate?.())
        .filter(Boolean)
        .sort((a, b) => a - b);

      if (!validDates.length) {
        return { start: null, end: null };
      }

      const start = new Date(validDates[0]);
      start.setHours(0, 0, 0, 0);

      const end = new Date(validDates[validDates.length - 1]);
      end.setHours(0, 0, 0, 0);

      return { start, end };
    },

    selectedWeekdayDates() {
      const { start, end } = this.observedDateRange;
      if (!start || !end) return [];

      const dates = [];
      const cursor = new Date(start);

      while (cursor <= end) {
        if (cursor.getDay() === this.selectedDay) {
          dates.push(this.dateKey(cursor));
        }
        cursor.setDate(cursor.getDate() + 1);
      }

      return dates;
    },

    slotStats() {
      const dayTickets = this.allTickets.filter((t) => {
        const date = t.joinedAt?.toDate?.();
        return date && date.getDay() === this.selectedDay;
      });

      const countsByDateAndSlot = {};

      for (const t of dayTickets) {
        const date = t.joinedAt?.toDate?.();
        if (!date) continue;

        const slotStart = this.getSlotStartMinutes(date);
        if (slotStart === null) continue;

        const dayKey = this.dateKey(date);
        const slotKey = `${dayKey}_${slotStart}`;

        countsByDateAndSlot[slotKey] = (countsByDateAndSlot[slotKey] || 0) + 1;
      }

      const weekdayDates = this.selectedWeekdayDates;
      const occurrenceCount = weekdayDates.length || 1;

      const averages = this.timeSlots.map((slot) => {
        const total = weekdayDates.reduce((sum, dayKey) => {
          const slotKey = `${dayKey}_${slot.startMinutes}`;
          return sum + (countsByDateAndSlot[slotKey] || 0);
        }, 0);

        const average = total / occurrenceCount;

        return {
          label: slot.label,
          startMinutes: slot.startMinutes,
          average,
        };
      });

      const maxAverage = Math.max(...averages.map((slot) => slot.average), 0);

      return averages.map((slot) => ({
        ...slot,
        normalized:
          maxAverage > 0 ? Math.round((slot.average / maxAverage) * 100) : 0,
      }));
    },

    chartData() {
      return this.slotStats.map((slot) => [slot.label, slot.normalized]);
    },

    chartDataset() {
      return {
        backgroundColor: this.slotStats.map((slot) =>
          this.getBarColor(slot.normalized),
        ),
        hoverBackgroundColor: this.slotStats.map((slot) =>
          this.getBarColor(slot.normalized),
        ),
        borderColor: this.slotStats.map(() => "#2563eb"),
        borderWidth: 2,
        borderRadius: 6,
        borderSkipped: false,
        barPercentage: 0.42,
        categoryPercentage: 0.68,
      };
    },

    chartOptions() {
      const slotStats = this.slotStats;
      return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            enabled: true,
            backgroundColor: "#0a1f44",
            bodyColor: "#ffffff",
            padding: 8,
            cornerRadius: 6,
            callbacks: {
              title: () => "",
              label: (context) => {
                const index = context.dataIndex;
                const avg = slotStats[index]?.average;
                return avg != null
                  ? `~${Math.round(avg)} people typically here`
                  : "";
              },
            },
          },
        },
        scales: {
          x: {
            offset: true,
            grid: {
              display: false,
              drawBorder: false,
            },
            border: { display: false },
            ticks: {
              autoSkip: false,
              maxRotation: 0,
              minRotation: 0,
              color: "#6b7280",
              font: {
                family: "Inter, sans-serif",
                size: 13,
                weight: "500",
              },
            },
          },
          y: {
            min: 0,
            max: 100,
            afterBuildTicks(scale) {
              scale.ticks = [0, 33, 66, 100].map((value) => ({ value }));
            },
            border: { display: false },
            grid: {
              color: "#e5e7eb",
              drawBorder: false,
            },
            ticks: {
              autoSkip: false,
              padding: 8,
              color: "#6b7280",
              font: {
                family: "Inter, sans-serif",
                size: 14,
                weight: "500",
              },
              callback(value) {
                if (value === 0) return "";
                if (value === 33) return "Light";
                if (value === 66) return "Moderate";
                if (value === 100) return "Busy";
                return "";
              },
            },
          },
        },
      };
    },
  },

  async mounted() {
    await this.fetchTickets();
  },

  methods: {
    async fetchTickets() {
      this.loading = true;
      try {
        const q = query(
          collection(db, "tickets"),
          where("branchId", "==", this.branchId),
          where("serviceType", "==", this.serviceType),
          where("status", "==", "served"),
        );
        const snap = await getDocs(q);
        this.allTickets = snap.docs.map((d) => d.data());
      } catch (err) {
        console.error("Failed to fetch tickets:", err);
      } finally {
        this.loading = false;
      }
    },

    selectDay(day) {
      this.selectedDay = day;
    },

    dateKey(date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    },

    getSlotStartMinutes(date) {
      const totalMinutes = date.getHours() * 60 + date.getMinutes();
      const slot = this.timeSlots.find(
        (slot) =>
          totalMinutes >= slot.startMinutes && totalMinutes < slot.endMinutes,
      );
      return slot ? slot.startMinutes : null;
    },

    getBarColor(value) {
      const clamped = Math.max(0, Math.min(100, value));
      const lightness = 88 - clamped * 0.4;
      return `hsl(218, 82%, ${lightness}%)`;
    },
  },
};
</script>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap");

.analytics-chart {
  width: 100%;
  max-width: 980px;
  margin: 0 auto;
  font-family: "Inter", sans-serif;
  padding-bottom: 40px;
  margin-top: 20px;
}

#graph-title {
  text-align: center;
  font-family: "Inter", sans-serif;
  font-size: 25px;
  font-weight: 700;
  color: #112a52;
  margin-bottom: 12px;
}

.days {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
  color: #4f545f;
  margin-top: 20px;
}

.days span {
  font-family: "Inter", sans-serif;
  font-size: 17px;
  font-weight: 500;
  cursor: pointer;
  transition: color 0.2s;
}

.days span:hover {
  color: #2563eb;
}

.days .active {
  color: #2563eb;
  border-bottom: 2px solid #2563eb;
  padding-bottom: 3px;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #4f545f;
  font-family: "Inter", sans-serif;
}

.closed-message {
  text-align: center;
  padding: 80px 0;
  color: #6b7280;
  font-family: "Inter", sans-serif;
  font-size: 15px;
}
</style>
