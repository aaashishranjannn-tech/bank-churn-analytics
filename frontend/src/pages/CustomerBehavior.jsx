import React, { useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { AGE_GROUPS, PRODUCTS, TENURE_DATA, BALANCE_TIERS, GENDER } from '../data/analyticsData';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, Filler);
gsap.registerPlugin(ScrollTrigger);

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: 'rgba(10,10,10,0.95)',
      borderColor: 'rgba(57,255,20,0.2)',
      borderWidth: 1,
      titleColor: '#39ff14',
      bodyColor: '#f5f0e8',
      titleFont: { family: "'Space Grotesk', sans-serif", size: 12 },
      bodyFont: { family: "'Inter', sans-serif", size: 11 },
    },
  },
  scales: {
    x: {
      grid: { color: 'rgba(255,255,255,0.04)' },
      ticks: { color: '#8a8a8a', font: { family: "'Inter', sans-serif", size: 11 } },
    },
    y: {
      grid: { color: 'rgba(255,255,255,0.04)' },
      ticks: {
        color: '#8a8a8a',
        font: { family: "'Inter', sans-serif", size: 11 },
        callback: v => v + '%',
      },
    },
  },
};

function Section({ children, sectionRef, index }) {
  return (
    <div
      ref={sectionRef}
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: 'clamp(5rem, 10vh, 8rem) clamp(1.5rem, 8vw, 5rem)',
        opacity: 0,
        transform: 'translateY(30px)',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
      }}
    >
      {children}
    </div>
  );
}

export default function CustomerBehavior() {
  const sectionsRef = useRef([]);

  useEffect(() => {
    const triggers = [];
    sectionsRef.current.forEach((el) => {
      if (!el) return;
      const trig = ScrollTrigger.create({
        trigger: el,
        start: 'top 75%',
        onEnter: () => {
          gsap.to(el, { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' });
        },
      });
      triggers.push(trig);
    });
    return () => {
      triggers.forEach(t => t.kill());
    };
  }, []);

  const setRef = (i) => (el) => {
    sectionsRef.current[i] = el;
  };

  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh' }}>
      {/* Page header */}
      <div style={{ padding: '7rem 2.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '0.6rem', letterSpacing: '0.35em', color: '#39ff14', marginBottom: '0.5rem' }}>
          04 / CUSTOMER BEHAVIOR
        </div>
        <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 'clamp(2rem, 5vw, 4rem)', fontWeight: 700, color: '#f5f0e8', letterSpacing: '-0.02em', paddingBottom: '2.5rem' }}>
          Behavioral Intelligence
        </h1>
      </div>

      {/* Section 1: Age Distribution */}
      <div
        ref={setRef(0)}
        style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 'clamp(4rem, 8vh, 6rem) clamp(1.5rem, 8vw, 5rem)', opacity: 0, transform: 'translateY(30px)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}
      >
        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '0.6rem', letterSpacing: '0.35em', color: '#39ff14', marginBottom: '1rem' }}>
          01 / AGE DISTRIBUTION
        </div>
        <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 'clamp(1.5rem, 3.5vw, 2.5rem)', fontWeight: 700, color: '#f5f0e8', marginBottom: '0.75rem' }}>
          The Age Churn Curve
        </h2>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.9rem', color: '#8a8a8a', maxWidth: '520px', marginBottom: '2.5rem', lineHeight: 1.7 }}>
          Customers aged 46–60 face a <span style={{ color: '#d4a843' }}>51% churn rate</span> — the most critical risk zone in the entire dataset.
        </p>
        <div style={{ height: '320px', maxWidth: '720px' }}>
          <Bar
            data={{
              labels: AGE_GROUPS.map(a => a.label),
              datasets: [{
                data: AGE_GROUPS.map(a => a.churnRate),
                backgroundColor: AGE_GROUPS.map(a => a.color + '44'),
                borderColor: AGE_GROUPS.map(a => a.color),
                borderWidth: 1,
                borderRadius: 2,
              }],
            }}
            options={{
              ...chartOptions,
              scales: {
                ...chartOptions.scales,
                y: {
                  ...chartOptions.scales.y,
                  max: 60,
                  ticks: { ...chartOptions.scales.y.ticks, callback: v => v + '%' },
                },
              },
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: '2rem', marginTop: '2rem' }}>
          {AGE_GROUPS.map(a => (
            <div key={a.label}>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.4rem', fontWeight: 700, color: a.color }}>{a.churnRate}%</div>
              <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.65rem', color: '#8a8a8a', letterSpacing: '0.1em', marginTop: '0.2rem' }}>{a.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 2: Gender */}
      <div
        ref={setRef(1)}
        style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 'clamp(4rem, 8vh, 6rem) clamp(1.5rem, 8vw, 5rem)', opacity: 0, transform: 'translateY(30px)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}
      >
        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '0.6rem', letterSpacing: '0.35em', color: '#39ff14', marginBottom: '1rem' }}>
          02 / GENDER SPLIT
        </div>
        <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 'clamp(1.5rem, 3.5vw, 2.5rem)', fontWeight: 700, color: '#f5f0e8', marginBottom: '0.75rem' }}>
          Gender & Churn
        </h2>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.9rem', color: '#8a8a8a', maxWidth: '520px', marginBottom: '3rem', lineHeight: 1.7 }}>
          Female customers churn at <span style={{ color: '#d4a843' }}>25.07%</span> vs male at <span style={{ color: '#39ff14' }}>16.46%</span> — a 52% relative difference.
        </p>
        <div style={{ display: 'flex', gap: 'clamp(2rem, 8vw, 6rem)', alignItems: 'flex-start' }}>
          {GENDER.map((g) => (
            <div key={g.gender}>
              <div style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 'clamp(3rem, 8vw, 6rem)',
                fontWeight: 700,
                color: g.gender === 'Female' ? '#d4a843' : '#39ff14',
                lineHeight: 1,
                marginBottom: '0.5rem',
              }}>
                {g.churnRate}%
              </div>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '0.7rem', letterSpacing: '0.2em', color: '#8a8a8a', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                {g.gender} Churn Rate
              </div>
              <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.8rem', color: '#8a8a8a' }}>
                {g.customers.toLocaleString()} customers · {g.churned.toLocaleString()} churned
              </div>
              <div
                style={{
                  marginTop: '1rem',
                  width: '120px',
                  height: '3px',
                  background: g.gender === 'Female' ? '#d4a843' : '#39ff14',
                  opacity: 0.6,
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Section 3: Balance tiers */}
      <div
        ref={setRef(2)}
        style={{ minHeight: '90vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 'clamp(4rem, 8vh, 6rem) clamp(1.5rem, 8vw, 5rem)', opacity: 0, transform: 'translateY(30px)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}
      >
        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '0.6rem', letterSpacing: '0.35em', color: '#39ff14', marginBottom: '1rem' }}>
          03 / BALANCE TIERS
        </div>
        <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 'clamp(1.5rem, 3.5vw, 2.5rem)', fontWeight: 700, color: '#f5f0e8', marginBottom: '0.75rem' }}>
          Balance vs Churn Risk
        </h2>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.9rem', color: '#8a8a8a', maxWidth: '520px', marginBottom: '2.5rem', lineHeight: 1.7 }}>
          Mid to high balance customers show elevated churn, suggesting dissatisfaction among engaged, high-value clients.
        </p>
        <div style={{ maxWidth: '680px' }}>
          {BALANCE_TIERS.map((tier) => (
            <div key={tier.label} style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.75rem', color: '#f5f0e8' }}>{tier.label}</span>
                <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '0.8rem', fontWeight: 600, color: '#d4a843' }}>{tier.churnRate}%</span>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.05)', height: '3px', borderRadius: '2px', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${(tier.churnRate / 35) * 100}%`,
                    background: 'linear-gradient(to right, #39ff14, #d4a843)',
                    borderRadius: '2px',
                  }}
                />
              </div>
              <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.6rem', color: '#8a8a8a', marginTop: '0.2rem' }}>
                {tier.customers.toLocaleString()} customers
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 4: Products */}
      <div
        ref={setRef(3)}
        style={{ minHeight: '90vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 'clamp(4rem, 8vh, 6rem) clamp(1.5rem, 8vw, 5rem)', opacity: 0, transform: 'translateY(30px)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}
      >
        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '0.6rem', letterSpacing: '0.35em', color: '#39ff14', marginBottom: '1rem' }}>
          04 / PRODUCTS OWNED
        </div>
        <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 'clamp(1.5rem, 3.5vw, 2.5rem)', fontWeight: 700, color: '#f5f0e8', marginBottom: '0.75rem' }}>
          The Over-Bundling Paradox
        </h2>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.9rem', color: '#8a8a8a', maxWidth: '520px', marginBottom: '2.5rem', lineHeight: 1.7 }}>
          2 products = <span style={{ color: '#39ff14' }}>7.6% churn</span> (safest). 3+ products = <span style={{ color: '#ff4444' }}>82–100% churn</span> (danger zone).
          More products does not mean more loyalty.
        </p>
        <div style={{ height: '300px', maxWidth: '600px' }}>
          <Line
            data={{
              labels: PRODUCTS.map(p => `${p.products} Product${p.products > 1 ? 's' : ''}`),
              datasets: [{
                data: PRODUCTS.map(p => p.churnRate),
                borderColor: '#39ff14',
                backgroundColor: 'rgba(57,255,20,0.06)',
                fill: true,
                tension: 0.3,
                pointBackgroundColor: PRODUCTS.map(p => p.color),
                pointBorderColor: PRODUCTS.map(p => p.color),
                pointRadius: 6,
                pointHoverRadius: 9,
              }],
            }}
            options={{
              ...chartOptions,
              scales: {
                ...chartOptions.scales,
                y: {
                  ...chartOptions.scales.y,
                  max: 110,
                  ticks: { ...chartOptions.scales.y.ticks, callback: v => v + '%' },
                },
              },
            }}
          />
        </div>
      </div>

      {/* Section 5: Tenure */}
      <div
        ref={setRef(4)}
        style={{ minHeight: '90vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 'clamp(4rem, 8vh, 6rem) clamp(1.5rem, 8vw, 5rem)', opacity: 0, transform: 'translateY(30px)' }}
      >
        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '0.6rem', letterSpacing: '0.35em', color: '#39ff14', marginBottom: '1rem' }}>
          05 / TENURE ANALYSIS
        </div>
        <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 'clamp(1.5rem, 3.5vw, 2.5rem)', fontWeight: 700, color: '#f5f0e8', marginBottom: '0.75rem' }}>
          Loyalty Over Time
        </h2>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.9rem', color: '#8a8a8a', maxWidth: '520px', marginBottom: '2.5rem', lineHeight: 1.7 }}>
          Churn rate is fairly stable across all tenure years (~20%), indicating that loyalty doesn't grow strongly with time.
          Early intervention is critical.
        </p>
        <div style={{ height: '280px', maxWidth: '720px' }}>
          <Bar
            data={{
              labels: TENURE_DATA.map(t => `Yr ${t.tenure}`),
              datasets: [{
                data: TENURE_DATA.map(t => t.churnRate),
                backgroundColor: TENURE_DATA.map(t => {
                  if (t.churnRate > 22) return 'rgba(212,168,67,0.5)';
                  return 'rgba(57,255,20,0.25)';
                }),
                borderColor: TENURE_DATA.map(t => {
                  if (t.churnRate > 22) return '#d4a843';
                  return '#39ff14';
                }),
                borderWidth: 1,
                borderRadius: 2,
              }],
            }}
            options={chartOptions}
          />
        </div>
      </div>
    </div>
  );
}
