import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Certificate, DownloadSimple, SpinnerGap } from '@phosphor-icons/react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

import FileSaver from 'file-saver';

const CertificateView = () => {
    const { programId } = useParams();
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(false);
    const certRef = useRef(null);

    useEffect(() => {
        const fetchEligibility = async () => {
            try {
                const API_URL = process.env.REACT_APP_BACKEND_URL || '';
                const token = localStorage.getItem('token');
                const config = { headers: { 'Authorization': `Bearer ${token}` } };
                const res = await axios.get(`${API_URL}/api/certificates/${programId}/eligibility`, config);
                setStatus(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchEligibility();
    }, [programId]);

    const handleGenerate = async () => {
        try {
            const API_URL = process.env.REACT_APP_BACKEND_URL || '';
            const token = localStorage.getItem('token');
            const config = { headers: { 'Authorization': `Bearer ${token}` } };
            const res = await axios.post(`${API_URL}/api/certificates/${programId}/generate`, {}, config);
            setStatus(prev => ({ ...prev, has_certificate: true, certificate: res.data.certificate }));
        } catch (err) {
            alert(err.response?.data?.detail || "Failed to generate certificate.");
        }
    };

    const handleDownloadPDF = async () => {
        if (!certRef.current) return;
        setDownloading(true);
        try {
            const canvas = await html2canvas(certRef.current, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff',
            });

            const imgData = canvas.toDataURL('image/jpeg', 0.95);
            const imgWidthPx = canvas.width;
            const imgHeightPx = canvas.height;

            // Use 'pt' for exact pixel-to-point matching (1px = 1pt approx in this context)
            const pdf = new jsPDF({
                orientation: imgWidthPx > imgHeightPx ? 'landscape' : 'portrait',
                unit: 'pt',
                format: [imgWidthPx, imgHeightPx],
            });

            pdf.addImage(imgData, 'JPEG', 0, 0, imgWidthPx, imgHeightPx);

            // Clean filename
            const courseName = (status?.certificate?.program_name || 'Course').replace(/[^a-z0-9]/gi, '_');
            const filename = `Unilearn_${courseName}_Certificate.pdf`;

            // Standard Blob output
            const pdfBlob = pdf.output('blob');
            
            // Use FileSaver for the most reliable download experience across browsers
            FileSaver.saveAs(pdfBlob, filename);
            
        } catch (err) {
            console.error('PDF generation failed:', err);
        } finally {
            setDownloading(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lms-primary"></div>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto py-10">
            <Link to={`/app/program/${programId}`} className="inline-flex items-center gap-2 text-lms-muted hover:text-lms-fg mb-6 text-sm print:hidden">
                <ArrowLeft /> Back to Program
            </Link>

            <header className="mb-10 text-center print:hidden">
                <h1 className="text-4xl font-serif font-bold text-lms-fg mb-2">Program Completion Certificate</h1>
                <p className="text-lms-muted">Progress: {status?.progress}</p>
            </header>

            {!status?.has_certificate ? (
                <div className="bg-white border border-lms-secondary rounded-2xl p-8 text-center shadow-sm print:hidden">
                    <Certificate size={64} className="mx-auto mb-4 text-lms-primary" weight="light" />
                    {status?.eligible ? (
                        <>
                            <h2 className="text-2xl font-bold text-green-600 mb-2">You are eligible!</h2>
                            <p className="text-lms-muted mb-6">Congratulations on completing all the units and quizzes in this program.</p>
                            <button
                                onClick={handleGenerate}
                                className="px-8 py-3 bg-lms-primary text-white font-bold rounded-xl shadow-lg hover:-translate-y-1 transition-all"
                            >
                                Generate Certificate
                            </button>
                        </>
                    ) : (
                        <>
                            <h2 className="text-2xl font-bold text-orange-600 mb-2">Not Yet Eligible</h2>
                            <p className="text-lms-muted">You must pass all unit quizzes in this program to generate your certificate. Keep learning!</p>
                        </>
                    )}
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="flex justify-end print:hidden">
                        <button
                            onClick={handleDownloadPDF}
                            disabled={downloading}
                            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-slate-700 to-slate-900 text-white font-bold rounded-xl shadow-lg hover:opacity-90 transition disabled:opacity-60"
                        >
                            {downloading
                                ? <><SpinnerGap size={18} className="animate-spin" /> Generating PDF...</>
                                : <><DownloadSimple size={18} weight="bold" /> Download Certificate</>
                            }
                        </button>
                    </div>

                    {/* ──── CERTIFICATE CARD ──── */}
                    <div
                        ref={certRef}
                        className="bg-white border-8 border-double border-lms-primary/20 p-12 md:p-20 text-center relative max-w-4xl mx-auto min-h-[600px] flex flex-col justify-center shadow-xl"
                    >
                        {/* Decorative Background */}
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-white -z-10 opacity-50"></div>
                        <div className="absolute top-10 left-10 w-32 h-32 border-t-2 border-l-2 border-lms-primary opacity-20"></div>
                        <div className="absolute bottom-10 right-10 w-32 h-32 border-b-2 border-r-2 border-lms-primary opacity-20"></div>

                        {/* Certificate Content */}
                        <div className="z-10 relative space-y-8">
                            <div>
                                <h1 className="text-5xl md:text-6xl font-serif font-bold text-slate-800 tracking-wider mb-2">CERTIFICATE</h1>
                                <p className="text-lg text-slate-500 uppercase tracking-[0.3em]">OF COMPLETION</p>
                            </div>

                            <div className="py-6">
                                <p className="text-xl italic text-slate-600 mb-6">This is to certify that</p>
                                <h2 className="text-4xl md:text-5xl font-serif text-lms-primary border-b border-lms-primary/30 inline-block pb-2 px-10">
                                    {status.certificate.user_name}
                                </h2>
                            </div>

                            <div className="max-w-xl mx-auto space-y-4">
                                <p className="text-lg text-slate-600">has successfully completed the program</p>
                                <h3 className="text-2xl font-bold text-slate-800">{status.certificate.program_name}</h3>
                            </div>

                            <div className="flex justify-between items-end px-12 pt-16 mt-8">
                                <div className="text-center">
                                    <div className="w-40 border-b border-slate-400 mb-2"></div>
                                    <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Date Issued</p>
                                    <p className="text-slate-600">{new Date(status.certificate.issued_at).toLocaleDateString()}</p>
                                </div>
                                <div className="flex flex-col items-center">
                                    <Certificate size={64} className="text-amber-500 mb-2" weight="fill" />
                                    <p className="font-serif font-bold text-lms-primary -mt-2">Unilearn</p>
                                </div>
                                <div className="text-center">
                                    <div className="w-40 border-b border-slate-400 mb-2 overflow-hidden flex justify-center h-12">
                                        <span className="font-cursive text-3xl text-slate-800 transform rotate-[-5deg]">Unilearn</span>
                                    </div>
                                    <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Director</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CertificateView;
