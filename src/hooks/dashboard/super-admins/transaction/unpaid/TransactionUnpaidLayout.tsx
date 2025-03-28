'use client'

import React, { useEffect, useState } from 'react'

import { collection, query, where, getDocs } from 'firebase/firestore'

import { db } from '@/utils/firebase'

import Image from 'next/image'

import { toast } from "react-hot-toast"

import TransactionUnpaidSkeleton from '@/hooks/dashboard/super-admins/transaction/unpaid/TransactionUnpaidSkelaton'

import EmptyUnpaidTransaction from '@/hooks/dashboard/super-admins/transaction/unpaid/content/empety'

import { Transaction } from '@/hooks/dashboard/super-admins/transaction/unpaid/lib/schema'

import { useModal } from '@/base/helper/useModal';

import { useModalWithClose } from '@/base/helper/ModalWithClose';

import { Pagination } from '@/base/helper/Pagination';

export default function TransactionUnpaidLayout() {
    const [pendingTransactions, setPendingTransactions] = useState<Transaction[]>([]);
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(0);
    const [itemsPerPage] = useState(9); // Show 9 items per page (3x3 grid)

    const { handleClickOutside } = useModalWithClose({
        isOpen: isModalOpen,
        onClose: () => setIsModalOpen(false)
    });

    useModal({
        isOpen: isModalOpen,
        onClose: () => setIsModalOpen(false)
    });

    useEffect(() => {
        const fetchPendingTransactions = async () => {
            try {
                const transactionRef = collection(db, process.env.NEXT_PUBLIC_COLLECTIONS_TRANSACTIONS as string);
                const q = query(transactionRef, where('status', '==', 'pending'));
                const querySnapshot = await getDocs(q);

                const transactions = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as Transaction[];

                // Sort transactions by createdAt in descending order
                const sortedTransactions = transactions.sort((a, b) =>
                    b.createdAt.toMillis() - a.createdAt.toMillis()
                );

                setPendingTransactions(sortedTransactions);
            } catch (error) {
                console.error('Error fetching pending transactions:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPendingTransactions();
    }, []);

    const handlePageChange = (selectedItem: { selected: number }) => {
        setCurrentPage(selectedItem.selected);
        // Scroll to top of the page when changing pages
        window.scrollTo(0, 0);
    };

    // Calculate pagination values
    const indexOfLastItem = (currentPage + 1) * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentTransactions = pendingTransactions.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(pendingTransactions.length / itemsPerPage);

    if (isLoading) {
        return <TransactionUnpaidSkeleton />
    }

    if (pendingTransactions.length === 0) {
        return <EmptyUnpaidTransaction />
    }

    return (
        <section className='min-h-full px-0 sm:px-4'>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="space-y-1">
                        <h1 className='text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent'>
                            Unpaid Transaction
                        </h1>
                        <p className='text-gray-500'>Manage and organize your unpaid transaction</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {currentTransactions.map((transaction) => (
                    <div key={transaction.id} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                        {/* Image Container */}
                        <div className="relative h-48 w-full">
                            <Image
                                src={transaction.imageUrl}
                                alt={transaction.projectTitle}
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            />
                        </div>

                        {/* Content Container */}
                        <div className="p-5">
                            {/* Header */}
                            <div className="flex justify-between items-start gap-4 mb-4">
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
                                        {transaction.projectTitle}
                                    </h3>
                                    <p className="text-sm text-gray-500 font-medium">
                                        #{transaction.orderId}
                                    </p>
                                </div>
                                <span className="inline-flex px-3 py-1 text-xs font-medium rounded-full bg-yellow-50 text-yellow-700 border border-yellow-200">
                                    {transaction.status}
                                </span>
                            </div>

                            {/* Info Grid */}
                            <div className="space-y-3">
                                {/* User Info */}
                                <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
                                    <div className="relative flex-shrink-0 w-12 h-12">
                                        {transaction.userPhotoURL ? (
                                            <Image
                                                src={transaction.userPhotoURL}
                                                alt={transaction.userName}
                                                fill
                                                className="rounded-full object-cover ring-2 ring-white"
                                            />
                                        ) : (
                                            <div className="w-full h-full rounded-full bg-gradient-to-br from-indigo-100 to-indigo-50 flex items-center justify-center">
                                                <svg className="w-6 h-6 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                </svg>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-gray-900 truncate mb-0.5">
                                            {transaction.userName}
                                        </p>
                                        <p className="text-xs text-gray-500 truncate flex items-center gap-1.5">
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                            </svg>
                                            {transaction.userEmail}
                                        </p>
                                    </div>
                                </div>

                                {/* Amount */}
                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                    <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <p className="text-sm font-semibold text-gray-900">
                                        Rp {transaction.amount.toLocaleString('id-ID')}
                                    </p>
                                </div>

                                {/* Date */}
                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                    <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <p className="text-sm text-gray-700">
                                        {transaction.createdAt.toDate().toLocaleDateString('id-ID', {
                                            day: 'numeric',
                                            month: 'short',
                                            year: 'numeric'
                                        })}
                                    </p>
                                </div>
                            </div>

                            {/* Action Button */}
                            <button
                                onClick={() => {
                                    setSelectedTransaction(transaction);
                                    setIsModalOpen(true);
                                }}
                                className="w-full mt-2 px-4 py-2.5 bg-white border border-indigo-200 
                                         hover:bg-indigo-50 hover:border-indigo-300 text-indigo-600 
                                         rounded-xl transition-all duration-200 flex items-center 
                                         justify-center gap-2 group-hover:bg-indigo-600 
                                         group-hover:text-white font-medium"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24"
                                    strokeWidth={2} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round"
                                        d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
                                    />
                                    <path strokeLinecap="round" strokeLinejoin="round"
                                        d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                                    />
                                </svg>
                                View Details
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
            />

            {isModalOpen && selectedTransaction && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
                    onClick={handleClickOutside}
                >
                    <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-gray-100">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">
                                        Transaction Details
                                    </h2>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-sm text-gray-500">Order ID:</span>
                                        <span className="text-sm font-medium text-gray-700">{selectedTransaction.orderId}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-all"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
                            {/* Project Overview Card */}
                            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                                <div className="flex gap-6 p-4">
                                    <div className="relative w-40 h-40 rounded-lg overflow-hidden">
                                        <Image
                                            src={selectedTransaction.imageUrl}
                                            alt={selectedTransaction.projectTitle}
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-xl font-semibold text-gray-900 mb-3">
                                            {selectedTransaction.projectTitle}
                                        </h3>
                                        <div className="flex gap-6">
                                            <div>
                                                <span className="text-sm text-gray-500 block mb-1">Amount</span>
                                                <span className="text-lg font-semibold text-green-600">
                                                    Rp {selectedTransaction.amount.toLocaleString('id-ID')}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-sm text-gray-500 block mb-1">Status</span>
                                                <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full
                                                    ${selectedTransaction.status === 'success' ? 'bg-green-100 text-green-700' :
                                                        selectedTransaction.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                            'bg-red-100 text-red-700'}`}>
                                                    {selectedTransaction.status.toUpperCase()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Info Grid */}
                            <div className="grid grid-cols-2 gap-6 mt-6">
                                {/* Basic Information */}
                                <div className="bg-gray-50 rounded-xl p-6">
                                    <h4 className="text-base font-semibold text-gray-900 mb-4">Basic Information</h4>
                                    <dl className="space-y-4">
                                        <div className="flex justify-between">
                                            <dt className="text-sm text-gray-600">Project ID</dt>
                                            <dd className="text-sm font-medium text-gray-900">{selectedTransaction.projectId}</dd>
                                        </div>
                                        <div className="flex justify-between">
                                            <dt className="text-sm text-gray-600">License Type</dt>
                                            <dd className="text-sm font-medium text-gray-900">{selectedTransaction.licenseType}</dd>
                                        </div>
                                        <div className="flex justify-between">
                                            <dt className="text-sm text-gray-600">Delivery Method</dt>
                                            <dd className="text-sm font-medium text-gray-900">{selectedTransaction.deliveryMethod}</dd>
                                        </div>
                                    </dl>
                                </div>

                                {/* User Information */}
                                <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-6 border border-gray-200 shadow-sm">
                                    <h4 className="text-base font-semibold text-gray-900 mb-6">User Information</h4>
                                    <div className="flex flex-col sm:flex-row items-center gap-6">
                                        {/* User Photo */}
                                        <div className="relative w-24 h-24 sm:w-32 sm:h-32">
                                            {selectedTransaction.userPhotoURL ? (
                                                <Image
                                                    src={selectedTransaction.userPhotoURL}
                                                    alt={selectedTransaction.userName}
                                                    fill
                                                    className="rounded-2xl object-cover ring-4 ring-white shadow-lg"
                                                />
                                            ) : (
                                                <div className="w-full h-full rounded-2xl bg-gradient-to-br from-indigo-100 to-indigo-50 flex items-center justify-center">
                                                    <svg className="w-12 h-12 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                    </svg>
                                                </div>
                                            )}
                                        </div>

                                        {/* User Details */}
                                        <div className="flex-1 min-w-0 text-center sm:text-left">
                                            <h5 className="text-xl font-bold text-gray-900 mb-2">
                                                {selectedTransaction.userName}
                                            </h5>
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-center sm:justify-start gap-2 text-gray-600">
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                    </svg>
                                                    <span className="text-sm">{selectedTransaction.userEmail}</span>
                                                </div>

                                                <div className="flex items-center justify-center sm:justify-start gap-2 text-gray-600">
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                                                    </svg>
                                                    <span className="text-sm">ID: {selectedTransaction.userId.slice(0, 8)}...</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className='grid grid-cols-2 gap-6 mt-6'>
                                {/* Payment Details */}
                                <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-6 border border-gray-200 shadow-sm">
                                    <h4 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                                        <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                        Payment Details
                                    </h4>

                                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                                        {/* Status Badge - Full Width */}
                                        <div className="col-span-1 sm:col-span-2 bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
                                            <dt className="text-sm text-gray-500 mb-1">Transaction Status</dt>
                                            <dd className="flex items-center gap-2">
                                                <span className={`w-2 h-2 rounded-full ${selectedTransaction.paymentDetails?.transaction_status === 'success' ? 'bg-green-500' :
                                                    selectedTransaction.paymentDetails?.transaction_status === 'pending' ? 'bg-yellow-500' :
                                                        'bg-red-500'
                                                    }`}></span>
                                                <span className="text-sm font-semibold text-gray-900">
                                                    {selectedTransaction.paymentDetails?.status_message || 'Status not available'}
                                                </span>
                                            </dd>
                                        </div>

                                        {/* Amount - Highlighted */}
                                        <div className="col-span-1 sm:col-span-2 bg-indigo-50 rounded-lg p-4 border border-indigo-100">
                                            <dt className="text-sm text-indigo-600 mb-1">Amount</dt>
                                            <dd className="text-2xl font-bold text-indigo-700">
                                                Rp {parseInt(selectedTransaction.paymentDetails?.gross_amount || '0').toLocaleString('id-ID')}
                                            </dd>
                                        </div>

                                        {/* Payment Method Info */}
                                        <div className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
                                            <dt className="text-sm text-gray-500 mb-1">Payment Method</dt>
                                            <dd className="text-sm font-semibold text-gray-900 capitalize">
                                                {(selectedTransaction.paymentDetails?.payment_type || 'Not specified').replace(/_/g, ' ')}
                                            </dd>
                                        </div>

                                        {/* Transaction Time */}
                                        <div className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
                                            <dt className="text-sm text-gray-500 mb-1">Transaction Time</dt>
                                            <dd className="text-sm font-semibold text-gray-900">
                                                {selectedTransaction.paymentDetails?.transaction_time ?
                                                    new Date(selectedTransaction.paymentDetails.transaction_time).toLocaleString('id-ID') :
                                                    'Not available'
                                                }
                                            </dd>
                                        </div>

                                        {/* VA Numbers */}
                                        {selectedTransaction.paymentDetails?.va_numbers?.map((va, index) => (
                                            <div key={index} className="col-span-1 sm:col-span-2 bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
                                                <dt className="text-sm text-gray-500 mb-1">Virtual Account ({va.bank.toUpperCase()})</dt>
                                                <dd className="flex items-center gap-3">
                                                    <span className="text-lg font-mono font-semibold text-gray-900">{va.va_number}</span>
                                                    <button
                                                        onClick={() => navigator.clipboard.writeText(va.va_number)}
                                                        className="text-indigo-600 hover:text-indigo-700 p-1 hover:bg-indigo-50 rounded-md transition-colors"
                                                        title="Copy VA Number"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                                        </svg>
                                                    </button>
                                                </dd>
                                            </div>
                                        ))}

                                        {/* Transaction IDs */}
                                        <div className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
                                            <dt className="text-sm text-gray-500 mb-1">Order ID</dt>
                                            <dd className="text-sm font-mono font-medium text-gray-900">
                                                {selectedTransaction.paymentDetails?.order_id || 'Not available'}
                                            </dd>
                                        </div>

                                        <div className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
                                            <dt className="text-sm text-gray-500 mb-1">Transaction ID</dt>
                                            <dd className="text-sm font-mono font-medium text-gray-900">
                                                {selectedTransaction.paymentDetails?.transaction_id || 'Not available'}
                                            </dd>
                                        </div>

                                        {/* Fraud Status */}
                                        <div className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
                                            <dt className="text-sm text-gray-500 mb-1">Fraud Status</dt>
                                            <dd className={`text-sm font-medium ${selectedTransaction.paymentDetails?.fraud_status === 'accept' ? 'text-green-600' : 'text-red-600'
                                                }`}>
                                                {(selectedTransaction.paymentDetails?.fraud_status || 'UNKNOWN').toUpperCase()}
                                            </dd>
                                        </div>

                                        {/* Actions - Full Width */}
                                        <div className="col-span-1 sm:col-span-2 mt-2">
                                            <dt className="text-sm text-gray-500 mb-3">Quick Actions</dt>
                                            <dd className="flex flex-wrap gap-3">
                                                {selectedTransaction.paymentDetails?.pdf_url && (
                                                    <a
                                                        href={selectedTransaction.paymentDetails.pdf_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
                                                    >
                                                        <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                                        </svg>
                                                        Download Invoice PDF
                                                    </a>
                                                )}
                                                {selectedTransaction.paymentDetails?.finish_redirect_url && (
                                                    <a
                                                        href={selectedTransaction.paymentDetails.finish_redirect_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-lg text-sm font-medium text-indigo-600 hover:bg-indigo-100 hover:border-indigo-200 transition-all duration-200"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                        </svg>
                                                        View Status Page
                                                    </a>
                                                )}
                                            </dd>
                                        </div>
                                    </dl>
                                </div>

                                {/* Address */}
                                {selectedTransaction.deliveryAddress && (
                                    <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-6 border border-gray-200 shadow-sm">
                                        <h4 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                                            <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                            Delivery Address
                                        </h4>

                                        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                                            {/* Full Name */}
                                            <div className="col-span-1 sm:col-span-2 bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
                                                <dt className="text-sm text-gray-500 mb-1">Full Name</dt>
                                                <dd className="text-sm font-semibold text-gray-900">
                                                    {selectedTransaction.deliveryAddress.fullName}
                                                </dd>
                                            </div>

                                            {/* Phone Number */}
                                            <div className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
                                                <dt className="text-sm text-gray-500 mb-1">Phone Number</dt>
                                                <dd className="text-sm font-mono font-medium text-gray-900">
                                                    {selectedTransaction.deliveryAddress.phone}
                                                </dd>
                                            </div>

                                            {/* Country */}
                                            {/* Postal Code */}
                                            <div className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
                                                <dt className="text-sm text-gray-500 mb-1">Postal Code</dt>
                                                <dd className="text-sm font-mono font-medium text-gray-900">
                                                    {selectedTransaction.deliveryAddress.postalCode}
                                                </dd>
                                            </div>

                                            {/* Province & City */}
                                            <div className="col-span-1 sm:col-span-2 bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
                                                <dt className="text-sm text-gray-500 mb-1">Province & City</dt>
                                                <dd className="text-sm font-medium text-gray-900">
                                                    {selectedTransaction.deliveryAddress.province}, {selectedTransaction.deliveryAddress.city}
                                                </dd>
                                            </div>

                                            {/* District */}
                                            <div className="col-span-1 sm:col-span-2 bg-white rounded-lg p-4 border border-gray-100 shadow-sm h-fit">
                                                <dt className="text-sm text-gray-500 mb-1">District</dt>
                                                <iframe
                                                    title="Location Map"
                                                    width="100%"
                                                    height="100%"
                                                    frameBorder="0"
                                                    src={`https://www.openstreetmap.org/export/embed.html?bbox=106.62206172943115%2C-6.576112400000001%2C106.64206172943115%2C-6.572112400000001&layer=mapnik&marker=${selectedTransaction.deliveryAddress.district}`}
                                                    allowFullScreen
                                                />
                                            </div>

                                            {/* Full Address */}
                                            <div className="col-span-1 sm:col-span-2 bg-indigo-50 rounded-lg p-4 border border-indigo-100">
                                                <dt className="text-sm text-indigo-600 mb-1">Complete Address</dt>
                                                <dd className="text-sm font-medium text-gray-900">
                                                    {selectedTransaction.deliveryAddress.streetAddress}
                                                    {selectedTransaction.deliveryAddress.details && (
                                                        <p className="mt-1 text-gray-600">
                                                            Additional Details: {selectedTransaction.deliveryAddress.details}
                                                        </p>
                                                    )}
                                                </dd>
                                            </div>

                                            {/* Copy Address Button */}
                                            <div className="col-span-1 sm:col-span-2 mt-2">
                                                <button
                                                    onClick={() => {
                                                        const fullAddress = `${selectedTransaction.deliveryAddress.streetAddress}, ${selectedTransaction.deliveryAddress.district}, ${selectedTransaction.deliveryAddress.city}, ${selectedTransaction.deliveryAddress.province}, ${selectedTransaction.deliveryAddress.postalCode}`;
                                                        navigator.clipboard.writeText(fullAddress);
                                                        toast.success('Address copied to clipboard');
                                                    }}
                                                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                                    </svg>
                                                    Copy Complete Address
                                                </button>
                                            </div>
                                        </dl>
                                    </div>
                                )}
                            </div>

                            {/* URLs and Links */}
                            <div className="mt-6 pt-4 border-t border-gray-200">
                                <h4 className="text-base font-semibold text-gray-900 mb-4">URLs & Links</h4>
                                <div className="space-y-3">
                                    <a href={selectedTransaction.linkTransaction} target="_blank" rel="noopener noreferrer" className="block py-2 text-indigo-600 hover:text-indigo-700">
                                        Transaction Link ↗
                                    </a>
                                </div>
                            </div>

                            {/* Timestamps */}
                            <div className="mt-6 pt-4 border-t border-gray-200">
                                <div className="flex justify-between text-sm">
                                    <div>
                                        <span className="text-gray-500">Created:</span>
                                        <span className="ml-2 text-gray-900">{selectedTransaction.createdAt.toDate().toLocaleString('id-ID')}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Updated:</span>
                                        <span className="ml-2 text-gray-900">{selectedTransaction.updatedAt.toDate().toLocaleString('id-ID')}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </section>
    )
}