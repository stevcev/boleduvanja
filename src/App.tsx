/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Plus, 
  History, 
  Activity, 
  CheckCircle2, 
  Calendar, 
  Search, 
  User, 
  Stethoscope,
  Clock,
  AlertCircle,
  Check,
  X,
  FileText,
  Baby,
  Building2,
  Beaker,
  ClipboardCheck,
  Bell
} from 'lucide-react';
import { format, parseISO, isSameDay, addDays, startOfDay } from 'date-fns';
import { mk } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';
import { SickLeave, SickLeaveStatus, AgeCategory, LeaveType, DoctorFacsimile } from './types';
import { cn } from './lib/utils';
import { Printer } from 'lucide-react';

// Mock initial data
const INITIAL_DATA: SickLeave[] = [
  {
    id: '1',
    medicalRecordNumber: '12345',
    parentName: 'Марко Петровски',
    childName: 'Петар Петровски',
    ageCategory: 'under_3',
    diagnosisCode: 'J06.9',
    leaveType: '7_days',
    openingDoctor: '169501',
    hasLabResults: true,
    hasSpecialistReport: false,
    hasHospitalDays: false,
    status: 'active',
    startDate: '2024-02-15',
    lastCheckedDate: '2024-02-18',
    createdAt: '2024-02-15T10:00:00Z'
  },
  {
    id: '2',
    medicalRecordNumber: '67890',
    parentName: 'Елена Стојановска',
    childName: 'Ана Стојановска',
    ageCategory: 'over_3',
    diagnosisCode: 'Z74',
    secondaryDiagnosisCode: 'R50.9',
    leaveType: '15_days',
    openingDoctor: '330825',
    hasLabResults: true,
    hasSpecialistReport: true,
    hasHospitalDays: true,
    hospitalDaysFrom: '2024-02-10',
    hospitalDaysTo: '2024-02-12',
    status: 'active',
    startDate: '2024-02-10',
    lastCheckedDate: '2024-02-19',
    createdAt: '2024-02-10T09:30:00Z'
  }
];

export default function App() {
  const [sickLeaves, setSickLeaves] = useState<SickLeave[]>(INITIAL_DATA);
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCheckModalOpen, setIsCheckModalOpen] = useState(false);
  const [isSearchKartonModalOpen, setIsSearchKartonModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [showReportPrompt, setShowReportPrompt] = useState(false);
  const [searchKartonValue, setSearchKartonValue] = useState('');
  const [searchKartonError, setSearchKartonError] = useState('');
  const [selectedLeave, setSelectedLeave] = useState<SickLeave | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const allChecksDone = useMemo(() => {
    const activeLeaves = sickLeaves.filter(s => s.status === 'active');
    if (activeLeaves.length === 0) return false;
    return activeLeaves.every(s => s.lastCheckedDate === format(new Date(), 'yyyy-MM-dd'));
  }, [sickLeaves]);

  useEffect(() => {
    if (allChecksDone && !isReportModalOpen) {
      setShowReportPrompt(true);
    } else {
      setShowReportPrompt(false);
    }
  }, [allChecksDone, isReportModalOpen]);

  // Form state for new/edit
  const [formData, setFormData] = useState({
    medicalRecordNumber: '',
    parentName: '',
    childName: '',
    ageCategory: 'under_3' as AgeCategory,
    diagnosisCode: '',
    secondaryDiagnosisCode: '',
    leaveType: '7_days' as LeaveType,
    openingDoctor: '169501' as DoctorFacsimile,
    closingDoctor: '169501' as DoctorFacsimile,
    hasLabResults: false,
    hasSpecialistReport: false,
    hasConsiliaryReport: false,
    hasHospitalDays: false,
    hospitalDaysFrom: '',
    hospitalDaysTo: '',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    closeSickLeave: false,
    endDate: format(new Date(), 'yyyy-MM-dd'),
  });

  const filteredLeaves = useMemo(() => {
    return sickLeaves.filter(item => {
      const matchesTab = activeTab === 'active' ? item.status === 'active' : item.status === 'completed';
      const matchesSearch = item.parentName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           item.childName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           item.medicalRecordNumber.includes(searchQuery);
      return matchesTab && matchesSearch;
    });
  }, [sickLeaves, activeTab, searchQuery]);

  const leavesToFinalizeToday = useMemo(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    return sickLeaves.filter(s => {
      if (s.status !== 'active') return false;
      
      let duration = 0;
      if (s.leaveType === '7_days') duration = 7;
      else if (s.leaveType === '15_days') duration = 15;
      
      if (duration > 0) {
        const expectedEndDate = format(addDays(parseISO(s.startDate), duration), 'yyyy-MM-dd');
        return expectedEndDate === today;
      }
      return false;
    });
  }, [sickLeaves]);

  const stats = useMemo(() => {
    const active = sickLeaves.filter(s => s.status === 'active').length;
    const completed = sickLeaves.filter(s => s.status === 'completed').length;
    const checkedToday = sickLeaves.filter(s => 
      s.status === 'active' && 
      s.lastCheckedDate === format(new Date(), 'yyyy-MM-dd')
    ).length;
    
    return { active, completed, checkedToday };
  }, [sickLeaves]);

  const handleOpenAddModal = () => {
    setFormData({
      medicalRecordNumber: '',
      parentName: '',
      childName: '',
      ageCategory: 'under_3',
      diagnosisCode: '',
      secondaryDiagnosisCode: '',
      leaveType: '7_days',
      openingDoctor: '169501',
      closingDoctor: '169501',
      hasLabResults: false,
      hasSpecialistReport: false,
      hasConsiliaryReport: false,
      hasHospitalDays: false,
      hospitalDaysFrom: '',
      hospitalDaysTo: '',
      startDate: format(new Date(), 'yyyy-MM-dd'),
      closeSickLeave: false,
      endDate: format(new Date(), 'yyyy-MM-dd'),
    });
    setIsModalOpen(true);
  };

  const handleOpenCheckModal = (leave: SickLeave) => {
    setSelectedLeave(leave);
    setFormData({
      medicalRecordNumber: leave.medicalRecordNumber,
      parentName: leave.parentName,
      childName: leave.childName,
      ageCategory: leave.ageCategory,
      diagnosisCode: leave.diagnosisCode,
      secondaryDiagnosisCode: leave.secondaryDiagnosisCode || '',
      leaveType: leave.leaveType,
      openingDoctor: leave.openingDoctor,
      closingDoctor: leave.closingDoctor || '169501',
      hasLabResults: leave.hasLabResults,
      hasSpecialistReport: leave.hasSpecialistReport,
      hasConsiliaryReport: leave.hasConsiliaryReport || false,
      hasHospitalDays: leave.hasHospitalDays,
      hospitalDaysFrom: leave.hospitalDaysFrom || '',
      hospitalDaysTo: leave.hospitalDaysTo || '',
      startDate: leave.startDate,
      closeSickLeave: false,
      endDate: format(new Date(), 'yyyy-MM-dd'),
    });
    setIsCheckModalOpen(true);
    setIsSearchKartonModalOpen(false);
    setSearchKartonValue('');
    setSearchKartonError('');
  };

  const handleSearchKarton = (e: React.FormEvent) => {
    e.preventDefault();
    const leave = sickLeaves.find(s => s.medicalRecordNumber === searchKartonValue && s.status === 'active');
    if (leave) {
      handleOpenCheckModal(leave);
    } else {
      setSearchKartonError('Не е пронајдено активно боледување со овој број на картон.');
    }
  };

  const handleSaveSickLeave = (e: React.FormEvent) => {
    e.preventDefault();
    const newLeave: SickLeave = {
      id: Math.random().toString(36).substr(2, 9),
      medicalRecordNumber: formData.medicalRecordNumber,
      parentName: formData.parentName,
      childName: formData.childName,
      ageCategory: formData.ageCategory,
      diagnosisCode: formData.diagnosisCode,
      secondaryDiagnosisCode: formData.diagnosisCode === 'Z74' ? formData.secondaryDiagnosisCode : undefined,
      leaveType: formData.leaveType,
      openingDoctor: formData.openingDoctor,
      hasLabResults: formData.hasLabResults,
      hasSpecialistReport: formData.hasSpecialistReport,
      hasConsiliaryReport: formData.leaveType === 'commission' ? formData.hasConsiliaryReport : undefined,
      hasHospitalDays: formData.hasHospitalDays,
      hospitalDaysFrom: formData.hasHospitalDays ? formData.hospitalDaysFrom : undefined,
      hospitalDaysTo: formData.hasHospitalDays ? formData.hospitalDaysTo : undefined,
      status: 'active',
      startDate: formData.startDate,
      createdAt: new Date().toISOString(),
    };
    setSickLeaves([newLeave, ...sickLeaves]);
    setIsModalOpen(false);
  };

  const handleDailyCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeave) return;

    setSickLeaves(prev => prev.map(item => {
      if (item.id === selectedLeave.id) {
        return {
          ...item,
          medicalRecordNumber: formData.medicalRecordNumber,
          diagnosisCode: formData.diagnosisCode,
          secondaryDiagnosisCode: formData.diagnosisCode === 'Z74' ? formData.secondaryDiagnosisCode : undefined,
          leaveType: formData.leaveType,
          openingDoctor: formData.openingDoctor,
          closingDoctor: formData.closeSickLeave ? formData.closingDoctor : item.closingDoctor,
          hasLabResults: formData.hasLabResults,
          hasSpecialistReport: formData.hasSpecialistReport,
          hasConsiliaryReport: formData.leaveType === 'commission' ? formData.hasConsiliaryReport : item.hasConsiliaryReport,
          hasHospitalDays: formData.hasHospitalDays,
          hospitalDaysFrom: formData.hasHospitalDays ? formData.hospitalDaysFrom : undefined,
          hospitalDaysTo: formData.hasHospitalDays ? formData.hospitalDaysTo : undefined,
          lastCheckedDate: format(new Date(), 'yyyy-MM-dd'),
          status: formData.closeSickLeave ? 'completed' : 'active',
          endDate: formData.closeSickLeave ? formData.endDate : item.endDate,
        };
      }
      return item;
    }));
    setIsCheckModalOpen(false);
    setSelectedLeave(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-emerald-100 p-2 rounded-lg">
              <Activity className="w-6 h-6 text-emerald-600" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">МедТрак МК</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-1 text-sm text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
              <Calendar className="w-4 h-4" />
              <span>{format(new Date(), 'EEEE, d MMMM', { locale: mk })}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Notifications */}
        {leavesToFinalizeToday.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3"
          >
            <Bell className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-amber-900">Известување за завршување</h4>
              <p className="text-sm text-amber-800">
                Следните боледувања треба да се завршат денес: 
                <span className="font-bold ml-1">
                  {leavesToFinalizeToday.map(l => l.childName).join(', ')}
                </span>
              </p>
            </div>
          </motion.div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Activity className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Активни</span>
            </div>
            <div className="text-3xl font-bold text-slate-900">{stats.active}</div>
            <p className="text-sm text-slate-500 mt-1">Тековни боледувања</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-emerald-50 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Завршени</span>
            </div>
            <div className="text-3xl font-bold text-slate-900">{stats.completed}</div>
            <p className="text-sm text-slate-500 mt-1">Вкупно издадени досега</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-amber-50 rounded-lg">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Денешна Проверка</span>
            </div>
            <div className="text-3xl font-bold text-slate-900">{stats.checkedToday}/{stats.active}</div>
            <p className="text-sm text-slate-500 mt-1">Проверени пациенти денес</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-6">
          <div className="flex bg-white p-1 rounded-xl border border-slate-200 w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('active')}
              className={cn(
                "flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2",
                activeTab === 'active' ? "bg-slate-900 text-white shadow-md" : "text-slate-600 hover:bg-slate-50"
              )}
            >
              <Activity className="w-4 h-4" />
              Активни
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={cn(
                "flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2",
                activeTab === 'history' ? "bg-slate-900 text-white shadow-md" : "text-slate-600 hover:bg-slate-50"
              )}
            >
              <History className="w-4 h-4" />
              Издадени
            </button>
          </div>

          <div className="flex gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Пребарај (Име, Картон)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 transition-all"
              />
            </div>
            <button
              onClick={() => setIsSearchKartonModalOpen(true)}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-medium transition-all flex items-center gap-2 shadow-lg shadow-amber-500/20"
            >
              <Clock className="w-4 h-4" />
              Нова Проверка
            </button>
            {allChecksDone && (
              <button
                onClick={() => setIsReportModalOpen(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-all flex items-center gap-2 shadow-lg shadow-blue-600/20"
              >
                <Printer className="w-4 h-4" />
                Дневен Извештај
              </button>
            )}
            <button
              onClick={handleOpenAddModal}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium transition-all flex items-center gap-2 shadow-lg shadow-emerald-600/20"
            >
              <Plus className="w-4 h-4" />
              Ново Боледување
            </button>
          </div>
        </div>

        {/* List */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-bottom border-slate-200">
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Пациент / Дете</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Дијагноза / Картон</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Тип / Период</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Документација</th>
                  {activeTab === 'active' && (
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Акции</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <AnimatePresence mode="popLayout">
                  {filteredLeaves.length > 0 ? (
                    filteredLeaves.map((item) => (
                      <motion.tr
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        key={item.id}
                        className="hover:bg-slate-50/50 transition-colors group"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-semibold">
                              {item.childName.charAt(0)}
                            </div>
                            <div>
                              <div className="font-medium text-slate-900">{item.childName}</div>
                              <div className="text-xs text-slate-500">Родител: {item.parentName}</div>
                              <div className="text-[10px] text-slate-400 font-bold uppercase">
                                {item.ageCategory === 'under_3' ? 'Под 3 години' : 'Над 3 години'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2 text-slate-600">
                              <Stethoscope className="w-4 h-4 text-slate-400" />
                              <span className="text-sm font-bold">
                                {item.diagnosisCode === 'Z74' 
                                  ? `Z74 и ${item.secondaryDiagnosisCode}` 
                                  : item.diagnosisCode}
                              </span>
                            </div>
                            <div className="text-xs text-slate-500 flex items-center gap-1">
                              <FileText className="w-3 h-3" />
                              Картон: {item.medicalRecordNumber}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1.5 text-sm text-slate-700">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              {format(parseISO(item.startDate), 'dd.MM.yyyy')}
                              {item.endDate && ` - ${format(parseISO(item.endDate), 'dd.MM.yyyy')}`}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 uppercase">
                                {item.leaveType === '7_days' ? '7 дена' : item.leaveType === '15_days' ? '15 дена' : 'Комисија'}
                              </span>
                              {item.status === 'active' && (() => {
                                let duration = 0;
                                if (item.leaveType === '7_days') duration = 7;
                                else if (item.leaveType === '15_days') duration = 15;
                                
                                if (duration > 0) {
                                  const expectedEndDate = addDays(parseISO(item.startDate), duration);
                                  const today = startOfDay(new Date());
                                  const targetDate = startOfDay(expectedEndDate);
                                  
                                  if (isSameDay(today, targetDate)) {
                                    return (
                                      <span className="text-[10px] font-bold bg-amber-400 text-amber-950 px-1.5 py-0.5 rounded uppercase">
                                        ЗА ИЗДАВАЊЕ ДЕНЕС
                                      </span>
                                    );
                                  } else if (today > targetDate) {
                                    return (
                                      <motion.span 
                                        animate={{ opacity: [1, 0.5, 1] }}
                                        transition={{ repeat: Infinity, duration: 1 }}
                                        className="text-[10px] font-bold bg-red-600 text-white px-1.5 py-0.5 rounded uppercase"
                                      >
                                        ДОЦНИ
                                      </motion.span>
                                    );
                                  }
                                }
                                return null;
                              })()}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <div title="Лабораторија" className={cn(
                              "p-1 rounded transition-colors", 
                              item.hasLabResults ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                            )}>
                              <Beaker className="w-4 h-4" />
                            </div>
                            <div title="Специјалистички извештај" className={cn(
                              "p-1 rounded transition-colors", 
                              item.hasSpecialistReport 
                                ? "bg-emerald-50 text-emerald-600" 
                                : (item.leaveType !== '7_days' ? "bg-red-50 text-red-600" : "bg-slate-50 text-slate-300")
                            )}>
                              <ClipboardCheck className="w-4 h-4" />
                            </div>
                            {item.leaveType === 'commission' && (
                              <div title="Конзилијарно мислење" className={cn(
                                "p-1 rounded transition-colors", 
                                item.hasConsiliaryReport ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                              )}>
                                <FileText className="w-4 h-4" />
                              </div>
                            )}
                            <div title="Болнички денови" className={cn("p-1 rounded", item.hasHospitalDays ? "bg-emerald-50 text-emerald-600" : "bg-slate-50 text-slate-300")}>
                              <Building2 className="w-4 h-4" />
                            </div>
                          </div>
                        </td>
                        {activeTab === 'active' && (
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleOpenCheckModal(item)}
                                className={cn(
                                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                                  item.lastCheckedDate === format(new Date(), 'yyyy-MM-dd')
                                    ? "text-emerald-600 bg-emerald-50"
                                    : "text-amber-600 bg-amber-50 hover:bg-amber-100"
                                )}
                              >
                                <Clock className="w-3.5 h-3.5" />
                                {item.lastCheckedDate === format(new Date(), 'yyyy-MM-dd') ? 'Проверено' : 'Дневна Проверка'}
                              </button>
                            </div>
                          </td>
                        )}
                      </motion.tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center gap-2 text-slate-400">
                          <Search className="w-8 h-8 opacity-20" />
                          <p className="text-sm">Нема пронајдено боледувања</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Daily Report Modal */}
      <AnimatePresence>
        {isReportModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 no-print">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsReportModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="text-lg font-bold text-slate-900">Дневен Извештај за Боледувања</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all"
                  >
                    <Printer className="w-4 h-4" />
                    Печати (A4)
                  </button>
                  <button
                    onClick={() => setIsReportModalOpen(false)}
                    className="p-2 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              <div id="printable-report" className="p-12 overflow-y-auto bg-white text-black font-serif">
                <div className="text-center mb-12 border-b-2 border-black pb-6">
                  <h1 className="text-2xl font-bold uppercase mb-2">Дневен Извештај за Боледувања</h1>
                  <p className="text-lg">Датум: {format(new Date(), 'dd.MM.yyyy')}</p>
                </div>

                <div className="space-y-8">
                  {sickLeaves.filter(s => s.lastCheckedDate === format(new Date(), 'yyyy-MM-dd')).map((leave, idx) => (
                    <div key={leave.id} className="border-b border-slate-200 pb-6 last:border-0">
                      <h2 className="text-xl font-bold mb-4">{idx + 1}. Пациент: {leave.childName}</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2 text-sm">
                        <p><span className="font-bold">Број на картон:</span> {leave.medicalRecordNumber}</p>
                        <p><span className="font-bold">Родител:</span> {leave.parentName}</p>
                        <p><span className="font-bold">Возраст:</span> {leave.ageCategory === 'under_3' ? 'Под 3 години' : 'Над 3 години'}</p>
                        <p><span className="font-bold">Дијагноза:</span> {leave.diagnosisCode}{leave.secondaryDiagnosisCode ? ` и ${leave.secondaryDiagnosisCode}` : ''}</p>
                        <p><span className="font-bold">Тип:</span> {leave.leaveType === '7_days' ? '7 дена' : leave.leaveType === '15_days' ? '15 дена' : 'Комисија'}</p>
                        <p><span className="font-bold">Доктор (Отвора):</span> {leave.openingDoctor}</p>
                        {leave.status === 'completed' && <p><span className="font-bold">Доктор (Затвора):</span> {leave.closingDoctor}</p>}
                        <p><span className="font-bold">Датум на почеток:</span> {format(parseISO(leave.startDate), 'dd.MM.yyyy')}</p>
                        {leave.endDate && <p><span className="font-bold">Датум на крај:</span> {format(parseISO(leave.endDate), 'dd.MM.yyyy')}</p>}
                        <p><span className="font-bold">Лабораторија:</span> {leave.hasLabResults ? 'ДА' : 'НЕ'}</p>
                        <p><span className="font-bold">Спец. Извештај:</span> {leave.hasSpecialistReport ? 'ДА' : 'НЕ'}</p>
                        {leave.leaveType === 'commission' && <p><span className="font-bold">Конзилијарно мислење:</span> {leave.hasConsiliaryReport ? 'ДА' : 'НЕ'}</p>}
                        <p><span className="font-bold">Болнички денови:</span> {leave.hasHospitalDays ? `ДА (${leave.hospitalDaysFrom} до ${leave.hospitalDaysTo})` : 'НЕ'}</p>
                        <p><span className="font-bold">Статус:</span> {leave.status === 'active' ? 'АКТИВНО' : 'ЗАВРШЕНО'}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-24 flex justify-between px-12 italic text-sm">
                  <div className="text-center border-t border-black pt-2 w-48">
                    Потпис на доктор
                  </div>
                  <div className="text-center border-t border-black pt-2 w-48">
                    Печат
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Report Prompt Toast */}
      <AnimatePresence>
        {showReportPrompt && (
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className="fixed bottom-8 right-8 z-50 bg-blue-600 text-white p-6 rounded-2xl shadow-2xl flex items-center gap-4 no-print"
          >
            <div className="p-2 bg-white/20 rounded-lg">
              <ClipboardCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold">Сите проверки се завршени!</p>
              <p className="text-sm opacity-90">Дали сакате да генерирате дневен извештај?</p>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => {
                    setIsReportModalOpen(true);
                    setShowReportPrompt(false);
                  }}
                  className="px-4 py-1.5 bg-white text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-50 transition-all"
                >
                  Генерирај
                </button>
                <button
                  onClick={() => setShowReportPrompt(false)}
                  className="px-4 py-1.5 bg-blue-700 text-white rounded-lg text-xs font-bold hover:bg-blue-800 transition-all"
                >
                  Затвори
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal for Search Karton */}
      <AnimatePresence>
        {isSearchKartonModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSearchKartonModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="text-lg font-bold text-slate-900">Нова Проверка</h3>
                <button
                  onClick={() => setIsSearchKartonModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSearchKarton} className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Внесете број на картон</label>
                  <input
                    required
                    autoFocus
                    type="number"
                    value={searchKartonValue}
                    onChange={(e) => {
                      setSearchKartonValue(e.target.value);
                      setSearchKartonError('');
                    }}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500"
                    placeholder="Пр. 12345"
                  />
                  {searchKartonError && (
                    <p className="text-xs text-red-600 font-medium">{searchKartonError}</p>
                  )}
                </div>
                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsSearchKartonModalOpen(false)}
                    className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 transition-all"
                  >
                    Откажи
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-medium hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/20"
                  >
                    Пребарај
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal for Add/Check */}
      <AnimatePresence>
        {(isModalOpen || isCheckModalOpen) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsModalOpen(false);
                setIsCheckModalOpen(false);
              }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="text-lg font-bold text-slate-900">
                  {isModalOpen ? 'Ново Боледување' : `Дневна Проверка: ${selectedLeave?.childName}`}
                </h3>
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setIsCheckModalOpen(false);
                  }}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form 
                onSubmit={isModalOpen ? handleSaveSickLeave : handleDailyCheck} 
                className="p-6 space-y-6 overflow-y-auto"
              >
                {/* Section 1: Identification */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Број на картон</label>
                    <input
                      required
                      type="number"
                      value={formData.medicalRecordNumber}
                      onChange={(e) => setFormData({ ...formData, medicalRecordNumber: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Возраст на дете</label>
                    <div className="flex bg-slate-100 p-1 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, ageCategory: 'under_3' })}
                        className={cn(
                          "flex-1 py-1.5 rounded-lg text-xs font-bold transition-all",
                          formData.ageCategory === 'under_3' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
                        )}
                      >
                        Под 3 год.
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, ageCategory: 'over_3' })}
                        className={cn(
                          "flex-1 py-1.5 rounded-lg text-xs font-bold transition-all",
                          formData.ageCategory === 'over_3' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
                        )}
                      >
                        Над 3 год.
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Име и презиме на родител</label>
                    <input
                      required
                      disabled={isCheckModalOpen}
                      type="text"
                      value={formData.parentName}
                      onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm disabled:opacity-50"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Име и презиме на дете</label>
                    <input
                      required
                      disabled={isCheckModalOpen}
                      type="text"
                      value={formData.childName}
                      onChange={(e) => setFormData({ ...formData, childName: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm disabled:opacity-50"
                    />
                  </div>
                </div>

                {/* Section 2: Diagnosis & Duration */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-slate-100 pt-6">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Шифра на дијагноза</label>
                    <div className="flex gap-2">
                      <input
                        required
                        type="text"
                        value={formData.diagnosisCode}
                        onChange={(e) => setFormData({ ...formData, diagnosisCode: e.target.value.toUpperCase() })}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                      />
                      {formData.diagnosisCode === 'Z74' && (
                        <div className="flex items-center gap-2 min-w-fit">
                          <span className="text-xs font-bold text-slate-400">и</span>
                          <input
                            required
                            type="text"
                            placeholder="Дополнителна..."
                            value={formData.secondaryDiagnosisCode}
                            onChange={(e) => setFormData({ ...formData, secondaryDiagnosisCode: e.target.value.toUpperCase() })}
                            className="w-32 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Тип на боледување</label>
                    <select
                      value={formData.leaveType}
                      onChange={(e) => setFormData({ ...formData, leaveType: e.target.value as LeaveType })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                    >
                      <option value="7_days">7 дена</option>
                      <option value="15_days">15 дена</option>
                      <option value="commission">Продолжување со комисија</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Доктор (Факсимил)</label>
                    <select
                      value={formData.openingDoctor}
                      onChange={(e) => setFormData({ ...formData, openingDoctor: e.target.value as DoctorFacsimile })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                    >
                      <option value="169501">169501</option>
                      <option value="330825">330825</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Датум на почеток</label>
                    <input
                      required
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                    />
                  </div>
                </div>

                {/* Section 3: Documentation */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-slate-100 pt-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Лабораторија</label>
                    <div className="flex bg-slate-100 p-1 rounded-lg">
                      <button type="button" onClick={() => setFormData({...formData, hasLabResults: true})} className={cn("flex-1 py-1 rounded text-[10px] font-bold", formData.hasLabResults ? "bg-white shadow-sm" : "text-slate-500")}>ДА</button>
                      <button type="button" onClick={() => setFormData({...formData, hasLabResults: false})} className={cn("flex-1 py-1 rounded text-[10px] font-bold", !formData.hasLabResults ? "bg-white shadow-sm" : "text-slate-500")}>НЕ</button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Спец. Извештај</label>
                    <div className="flex bg-slate-100 p-1 rounded-lg">
                      <button type="button" onClick={() => setFormData({...formData, hasSpecialistReport: true})} className={cn("flex-1 py-1 rounded text-[10px] font-bold", formData.hasSpecialistReport ? "bg-white shadow-sm" : "text-slate-500")}>ДА</button>
                      <button type="button" onClick={() => setFormData({...formData, hasSpecialistReport: false})} className={cn("flex-1 py-1 rounded text-[10px] font-bold", !formData.hasSpecialistReport ? "bg-white shadow-sm" : "text-slate-500")}>НЕ</button>
                    </div>
                  </div>
                  {formData.leaveType === 'commission' && (
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Конзилијарно</label>
                      <div className="flex bg-slate-100 p-1 rounded-lg">
                        <button type="button" onClick={() => setFormData({...formData, hasConsiliaryReport: true})} className={cn("flex-1 py-1 rounded text-[10px] font-bold", formData.hasConsiliaryReport ? "bg-white shadow-sm" : "text-slate-500")}>ДА</button>
                        <button type="button" onClick={() => setFormData({...formData, hasConsiliaryReport: false})} className={cn("flex-1 py-1 rounded text-[10px] font-bold", !formData.hasConsiliaryReport ? "bg-white shadow-sm" : "text-slate-500")}>НЕ</button>
                      </div>
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Болнички денови</label>
                    <div className="flex bg-slate-100 p-1 rounded-lg">
                      <button type="button" onClick={() => setFormData({...formData, hasHospitalDays: true})} className={cn("flex-1 py-1 rounded text-[10px] font-bold", formData.hasHospitalDays ? "bg-white shadow-sm" : "text-slate-500")}>ДА</button>
                      <button type="button" onClick={() => setFormData({...formData, hasHospitalDays: false})} className={cn("flex-1 py-1 rounded text-[10px] font-bold", !formData.hasHospitalDays ? "bg-white shadow-sm" : "text-slate-500")}>НЕ</button>
                    </div>
                  </div>
                </div>

                {formData.hasHospitalDays && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="grid grid-cols-2 gap-4 bg-blue-50 p-4 rounded-xl"
                  >
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-blue-600 uppercase">Болнички од</label>
                      <input
                        type="date"
                        value={formData.hospitalDaysFrom}
                        onChange={(e) => setFormData({ ...formData, hospitalDaysFrom: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-blue-100 rounded-lg text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-blue-600 uppercase">Болнички до</label>
                      <input
                        type="date"
                        value={formData.hospitalDaysTo}
                        onChange={(e) => setFormData({ ...formData, hospitalDaysTo: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-blue-100 rounded-lg text-xs"
                      />
                    </div>
                  </motion.div>
                )}

                {/* Section 4: Daily Check Specifics */}
                {isCheckModalOpen && (
                  <div className="border-t border-slate-100 pt-6 space-y-4">
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className={cn("w-5 h-5", formData.closeSickLeave ? "text-emerald-600" : "text-slate-300")} />
                        <span className="text-sm font-bold text-slate-700">Затвори боледување</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, closeSickLeave: !formData.closeSickLeave })}
                        className={cn(
                          "w-12 h-6 rounded-full transition-all relative",
                          formData.closeSickLeave ? "bg-emerald-600" : "bg-slate-200"
                        )}
                      >
                        <div className={cn(
                          "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                          formData.closeSickLeave ? "left-7" : "left-1"
                        )} />
                      </button>
                    </div>

                    {formData.closeSickLeave && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid grid-cols-1 md:grid-cols-2 gap-4"
                      >
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Краен датум</label>
                          <input
                            required
                            type="date"
                            value={formData.endDate}
                            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Доктор (Затвора)</label>
                          <select
                            value={formData.closingDoctor}
                            onChange={(e) => setFormData({ ...formData, closingDoctor: e.target.value as DoctorFacsimile })}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                          >
                            <option value="169501">169501</option>
                            <option value="330825">330825</option>
                          </select>
                        </div>
                      </motion.div>
                    )}
                  </div>
                )}

                <div className="pt-4 flex gap-3 sticky bottom-0 bg-white pb-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      setIsCheckModalOpen(false);
                    }}
                    className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 transition-all"
                  >
                    Откажи
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20"
                  >
                    {isModalOpen ? 'Зачувај' : 'Потврди Проверка'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-xs text-slate-400 font-medium uppercase tracking-widest">
            Систем за управување со боледувања • 2024
          </p>
        </div>
      </footer>
    </div>
  );
}
