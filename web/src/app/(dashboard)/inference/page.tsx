// web/src/app/(dashboard)/inference/page.tsx
'use client';

import { useState } from 'react';
import { Topbar } from '@/components/layout/topbar';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle } from 'lucide-react';

const jobOptions = ['management', 'technician', 'entrepreneur', 'blue-collar', 'unknown', 'retired', 'admin', 'services', 'self-employed', 'unemployed', 'housemaid', 'student'];
const maritalOptions = ['married', 'single', 'divorced'];
const educationOptions = ['primary', 'secondary', 'tertiary', 'unknown'];
const yesNoOptions = ['yes', 'no'];
const contactOptions = ['cellular', 'telephone', 'unknown'];
const monthOptions = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const poutcomeOptions = ['success', 'failure', 'other', 'unknown'];

export default function InferencePage() {
  const [formData, setFormData] = useState({
    age: 30,
    job: 'management',
    marital: 'married',
    education: 'tertiary',
    default: 'no',
    balance: 1000,
    housing: 'yes',
    loan: 'no',
    contact: 'cellular',
    day: 15,
    month: 'may',
    campaign: 1,
    pdays: -1,
    previous: 0,
    poutcome: 'unknown',
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/inference/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Scoring failed');
      }

      setResult(data.data.prediction);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to score lead');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setError('');
  };

  return (
    <>
      <Topbar 
        title="Quick Score" 
        subtitle="Get instant prediction for a single lead"
      />
      
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Demographics */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Demographics</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput
                  label="Age"
                  type="number"
                  value={formData.age}
                  onChange={(v) => handleChange('age', Number(v))}
                  min={18}
                  max={100}
                />
                <FormSelect
                  label="Job"
                  value={formData.job}
                  onChange={(v) => handleChange('job', v)}
                  options={jobOptions}
                />
                <FormSelect
                  label="Marital Status"
                  value={formData.marital}
                  onChange={(v) => handleChange('marital', v)}
                  options={maritalOptions}
                />
                <FormSelect
                  label="Education"
                  value={formData.education}
                  onChange={(v) => handleChange('education', v)}
                  options={educationOptions}
                />
              </div>
            </div>

            {/* Financial */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput
                  label="Balance"
                  type="number"
                  value={formData.balance}
                  onChange={(v) => handleChange('balance', Number(v))}
                />
                <FormSelect
                  label="Default"
                  value={formData.default}
                  onChange={(v) => handleChange('default', v)}
                  options={yesNoOptions}
                />
                <FormSelect
                  label="Housing Loan"
                  value={formData.housing}
                  onChange={(v) => handleChange('housing', v)}
                  options={yesNoOptions}
                />
                <FormSelect
                  label="Personal Loan"
                  value={formData.loan}
                  onChange={(v) => handleChange('loan', v)}
                  options={yesNoOptions}
                />
              </div>
            </div>

            {/* Campaign */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Campaign</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormSelect
                  label="Contact Type"
                  value={formData.contact}
                  onChange={(v) => handleChange('contact', v)}
                  options={contactOptions}
                />
                <FormInput
                  label="Day"
                  type="number"
                  value={formData.day}
                  onChange={(v) => handleChange('day', Number(v))}
                  min={1}
                  max={31}
                />
                <FormSelect
                  label="Month"
                  value={formData.month}
                  onChange={(v) => handleChange('month', v)}
                  options={monthOptions}
                />
                <FormInput
                  label="Campaign Contacts"
                  type="number"
                  value={formData.campaign}
                  onChange={(v) => handleChange('campaign', Number(v))}
                  min={1}
                />
                <FormInput
                  label="Days Since Previous (-1 = never)"
                  type="number"
                  value={formData.pdays}
                  onChange={(v) => handleChange('pdays', Number(v))}
                  min={-1}
                />
                <FormInput
                  label="Previous Contacts"
                  type="number"
                  value={formData.previous}
                  onChange={(v) => handleChange('previous', Number(v))}
                  min={0}
                />
                <FormSelect
                  label="Previous Outcome"
                  value={formData.poutcome}
                  onChange={(v) => handleChange('poutcome', v)}
                  options={poutcomeOptions}
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Result */}
            {result && (
              <div className="bg-primary-50 border border-primary-200 rounded-lg p-6">
                <div className="flex items-start space-x-3 mb-4">
                  <CheckCircle className="w-6 h-6 text-primary-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-primary-900 mb-2">
                      Prediction Result
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-primary-700">Probability</p>
                        <p className="text-2xl font-bold text-primary-900">
                          {(result.probability * 100).toFixed(1)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-primary-700">Risk Level</p>
                        <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                          result.risk_level === 'High' ? 'bg-green-500 text-white' :
                          result.risk_level === 'Medium' ? 'bg-yellow-500 text-white' :
                          'bg-gray-500 text-white'
                        }`}>
                          {result.risk_level}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-primary-700 mt-4">
                      Prediction: <span className="font-semibold">{result.prediction_label.toUpperCase()}</span>
                    </p>
                  </div>
                </div>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={handleReset}
                >
                  Score Another Lead
                </Button>
              </div>
            )}

            {/* Actions */}
            {!result && (
              <div className="flex justify-end space-x-3">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => window.location.reload()}
                  disabled={loading}
                >
                  Reset
                </Button>
                <Button type="submit" loading={loading}>
                  {loading ? 'Scoring...' : 'Get Score'}
                </Button>
              </div>
            )}
          </form>
        </div>
      </div>
    </>
  );
}

function FormInput({ label, value, onChange, type = 'text', min, max }: any) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        min={min}
        max={max}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
      />
    </div>
  );
}

function FormSelect({ label, value, onChange, options }: any) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
      >
        {options.map((opt: string) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}