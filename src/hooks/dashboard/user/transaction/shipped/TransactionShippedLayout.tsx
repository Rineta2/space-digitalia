'use client'

import React, { useEffect, useState } from 'react'

import { collection, onSnapshot, query, where } from 'firebase/firestore'

import { db } from '@/utils/firebase'

import Image from 'next/image'

import { Transaction } from '@/hooks/dashboard/user/transaction/shipped/lib/schema'

import { useAuth } from '@/utils/context/AuthContext'

import TransactionShippedSkeleton from '@/hooks/dashboard/user/transaction/shipped/TransactionShippedSkelaton'

import EmptyShippedTransaction from '@/hooks/dashboard/user/transaction/shipped/content/empety'

import { useModal } from '@/base/helper/useModal'

import { Pagination } from '@/base/helper/Pagination'

import Link from 'next/link'

export default function TransactionShippedLayout() {
    const { user } = useAuth()
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(true)

    // Add pagination state
    const [currentPage, setCurrentPage] = useState(0)
    const itemsPerPage = 8 // Adjust this number as needed

    // Use the useModal hook
    useModal({
        isOpen: isModalOpen,
        onClose: () => setIsModalOpen(false)
    })

    useEffect(() => {
        if (!user?.uid) {
            setIsLoading(false)
            return
        }

        const transactionsRef = collection(db, process.env.NEXT_PUBLIC_COLLECTIONS_TRANSACTIONS as string)
        const userTransactionsQuery = query(
            transactionsRef,
            where('userId', '==', user.uid)
        )

        const unsubscribe = onSnapshot(userTransactionsQuery, (snapshot) => {
            const transactionData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Transaction[]

            // Filter for transactions with statusDelivery, excluding cancelled and completed status, and sort
            const shippedTransactions = transactionData
                .filter(transaction =>
                    transaction.statusDelivery &&
                    transaction.status !== 'cancelled' &&
                    transaction.statusDelivery !== 'completed'
                )
                .sort((a, b) =>
                    b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime()
                );

            setTransactions(shippedTransactions)
            setIsLoading(false)
        }, (error) => {
            console.error("Error fetching transactions:", error)
            setIsLoading(false)
        })

        return () => unsubscribe()
    }, [user?.uid])

    // Calculate pagination values
    const offset = currentPage * itemsPerPage
    const paginatedTransactions = transactions.slice(offset, offset + itemsPerPage)
    const pageCount = Math.ceil(transactions.length / itemsPerPage)

    // Handle page change
    const handlePageChange = ({ selected }: { selected: number }) => {
        setCurrentPage(selected)
        // Scroll to top of the page
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    if (isLoading) {
        return <TransactionShippedSkeleton />;
    }

    if (transactions.length === 0) {
        return (
            <EmptyShippedTransaction />
        );
    }

    return (
        <section className='min-h-full px-0 sm:px-4'>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="space-y-1">
                        <h1 className='text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent'>
                            Pesanan Dikirim
                        </h1>
                        <p className='text-gray-500'>Kelola dan urutkan pesanan Anda yang telah dikirim</p>
                    </div>
                </div>
            </div>

            {/* Transaction Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
                {paginatedTransactions.map((transaction) => (
                    <div
                        key={transaction.id}
                        className="group bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm 
                                 hover:shadow-xl hover:border-gray-200 transition-all duration-300 
                                 transform hover:-translate-y-1"
                    >
                        {/* Image Container */}
                        <div className="relative h-48 overflow-hidden">
                            <Image
                                src={transaction.imageUrl}
                                alt={transaction.projectTitle}
                                fill
                                className="object-cover transform group-hover:scale-105 transition-transform duration-300"
                            />
                            {/* Status Badge */}
                            <div className="absolute top-3 right-3">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium 
                                    ${transaction.status === 'success'
                                        ? 'bg-green-100 text-green-800'
                                        : transaction.status === 'pending'
                                            ? 'bg-yellow-100 text-yellow-800'
                                            : 'bg-red-100 text-red-800'
                                    }`}>
                                    {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                                </span>
                            </div>
                        </div>

                        <div className="p-5 space-y-4">
                            {/* Project Title */}
                            <h3 className="font-semibold text-gray-800 line-clamp-1 text-lg group-hover:text-indigo-600 transition-colors">
                                {transaction.projectTitle}
                            </h3>

                            {/* Amount */}
                            <div className="flex items-center justify-between bg-gray-50 p-3 rounded-xl">
                                <span className="text-gray-600 text-sm">Harga</span>
                                <span className="font-semibold text-gray-900">
                                    Rp {transaction.amount.toLocaleString()}
                                </span>
                            </div>

                            {/* Transaction Details */}
                            <div className="space-y-2.5">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-500 flex items-center gap-1.5">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                                            />
                                        </svg>
                                        Payment
                                    </span>
                                    <span className="font-medium text-gray-900 capitalize">{transaction.paymentMethod}</span>
                                </div>

                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-500 flex items-center gap-1.5">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                                            />
                                        </svg>
                                        License
                                    </span>
                                    <span className="font-medium text-gray-900 capitalize">{transaction.licenseType}</span>
                                </div>
                            </div>

                            {/* User Info */}
                            <div className="pt-4 border-t border-gray-100">
                                <div className="flex items-center gap-4">
                                    {/* User Avatar */}
                                    <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-indigo-100 shadow-sm">
                                        {transaction.userPhotoURL ? (
                                            <Image
                                                src={transaction.userPhotoURL}
                                                alt={transaction.userName}
                                                fill
                                                className="object-cover"
                                                sizes="40px"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-indigo-50 to-white flex items-center justify-center">
                                                <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                </svg>
                                            </div>
                                        )}
                                    </div>

                                    {/* User Info */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-gray-800 truncate group-hover:text-indigo-600 transition-colors">
                                            {transaction.userName}
                                        </p>
                                        <p className="text-xs text-gray-500 truncate">
                                            {transaction.userEmail}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Date */}
                            <div className="text-xs text-gray-500">
                                {transaction.createdAt.toDate().toLocaleDateString('id-ID', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </div>

                            {/* View Details Button */}
                            <button
                                onClick={() => {
                                    setSelectedTransaction(transaction)
                                    setIsModalOpen(true)
                                }}
                                className="w-full mt-2 px-4 py-2.5 bg-white border border-indigo-200 
                                         hover:bg-indigo-50 hover:border-indigo-300 text-indigo-600 
                                         rounded-xl transition-all duration-200 flex items-center 
                                         justify-center gap-2 group-hover:bg-indigo-600 
                                         group-hover:text-white font-medium"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                                    strokeWidth={2} stroke="currentColor" className="w-4 h-4">
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

            {/* Add Pagination Component */}
            <Pagination
                currentPage={currentPage}
                totalPages={pageCount}
                onPageChange={handlePageChange}
            />

            {/* Detail Modal */}
            {isModalOpen && selectedTransaction && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
                    <div className="mockup-window border border-base-300 w-full max-w-4xl bg-white my-8">
                        <div className="p-6 max-h-[80vh] overflow-y-auto">
                            {/* Header */}
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-indigo-800 bg-clip-text text-transparent">
                                        Detail Transaksi
                                    </h2>
                                    <p className="text-gray-500 mt-1">Order ID: {selectedTransaction.orderId}</p>
                                </div>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="space-y-8">
                                {/* Project Overview Card */}
                                <div className="bg-gradient-to-br from-indigo-50 to-white rounded-xl p-4 shadow-sm">
                                    <div className="flex gap-6">
                                        {/* Project Image */}
                                        <div className="relative w-48 h-32 rounded-lg overflow-hidden shadow-md">
                                            <Image
                                                src={selectedTransaction.imageUrl}
                                                alt={selectedTransaction.projectTitle}
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                        {/* Project Info */}
                                        <div className="flex-1">
                                            <h3 className="text-xl font-semibold text-gray-800 mb-2">
                                                {selectedTransaction.projectTitle}
                                            </h3>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-gray-500">Jumlah:</span>
                                                    <span className="font-semibold text-green-600">
                                                        Rp {selectedTransaction.amount.toLocaleString()}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-gray-500">Status:</span>
                                                    <span className={`font-medium px-3 py-1 rounded-full text-sm capitalize 
                                                        ${selectedTransaction.status === 'success' ? 'bg-green-100 text-green-700' :
                                                            selectedTransaction.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                                'bg-red-100 text-red-700'
                                                        }`}>
                                                        {selectedTransaction.status.toUpperCase()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Information Grid */}
                                <div className="grid grid-cols-2 gap-6">
                                    {/* User Information */}
                                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300">
                                        <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-800 bg-clip-text text-transparent">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                            Informasi Pengguna
                                        </h3>
                                        <div className="space-y-4">
                                            <div className="bg-gray-50/50 p-4 rounded-xl hover:bg-gray-50 transition-all duration-200 group">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm text-gray-500 group-hover:text-gray-600 transition-colors">Nama</span>
                                                    <span className="font-medium text-gray-800 bg-white px-3 py-1 rounded-full shadow-sm border border-gray-100">
                                                        {selectedTransaction.userName}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="bg-gray-50/50 p-4 rounded-xl hover:bg-gray-50 transition-all duration-200 group">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm text-gray-500 group-hover:text-gray-600 transition-colors">Email</span>
                                                    <span className="font-medium text-gray-800 bg-white px-3 py-1 rounded-full shadow-sm border border-gray-100">
                                                        {selectedTransaction.userEmail}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="bg-gray-50/50 p-4 rounded-xl hover:bg-gray-50 transition-all duration-200 group">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm text-gray-500 group-hover:text-gray-600 transition-colors">Users I</span>
                                                    <span className="font-medium text-gray-800 bg-white px-3 py-1 rounded-full shadow-sm border border-gray-100 text-sm">
                                                        {selectedTransaction.userId}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* License & Delivery */}
                                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300">
                                        <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-800 bg-clip-text text-transparent">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                                            </svg>
                                            Lisensi & Pengiriman
                                        </h3>
                                        <div className="space-y-4">
                                            <div className="bg-gray-50/50 p-4 rounded-xl hover:bg-gray-50 transition-all duration-200 group">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm text-gray-500 group-hover:text-gray-600 transition-colors">Tipe Lisensi</span>
                                                    <span className="font-medium text-gray-800 bg-white px-3 py-1 rounded-full shadow-sm border border-gray-100">
                                                        {selectedTransaction.licenseType}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="bg-gray-50/50 p-4 rounded-xl hover:bg-gray-50 transition-all duration-200 group">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm text-gray-500 group-hover:text-gray-600 transition-colors">Metode Pengiriman</span>
                                                    <span className="font-medium text-gray-800 bg-white px-3 py-1 rounded-full shadow-sm border border-gray-100">
                                                        {selectedTransaction.deliveryMethod}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="bg-gray-50/50 p-4 rounded-xl hover:bg-gray-50 transition-all duration-200 group">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm text-gray-500 group-hover:text-gray-600 transition-colors">Status Pengiriman</span>
                                                    <span className={`font-medium px-3 py-1 rounded-full text-sm capitalize 
                                                        ${selectedTransaction.statusDelivery === 'pending'
                                                            ? 'bg-amber-100 text-amber-800'
                                                            : selectedTransaction.statusDelivery === 'processing'
                                                                ? 'bg-blue-100 text-blue-800'
                                                                : selectedTransaction.statusDelivery === 'shipping'
                                                                    ? 'bg-indigo-100 text-indigo-800'
                                                                    : selectedTransaction.statusDelivery === 'delivery'
                                                                        ? 'bg-purple-100 text-purple-800'
                                                                        : selectedTransaction.statusDelivery === 'completed'
                                                                            ? 'bg-green-100 text-green-800'
                                                                            : selectedTransaction.statusDelivery === 'canceled'
                                                                                ? 'bg-red-100 text-red-800'
                                                                                : 'bg-gray-100 text-gray-800'
                                                        }`}>
                                                        {selectedTransaction.statusDelivery}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Payment Details */}
                                    <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 col-span-2 hover:shadow-xl transition-shadow duration-300">
                                        <h3 className="text-lg font-semibold mb-6 flex items-center gap-3 text-gray-800">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                            </svg>
                                            Detail Pembayaran
                                        </h3>
                                        <div className="grid grid-cols-2 gap-8">
                                            {/* Payment Method Section */}
                                            <div className="space-y-4">
                                                <div className="bg-gray-50 p-4 rounded-xl hover:bg-gray-100 transition-colors duration-200">
                                                    <span className="text-sm font-medium text-gray-500 block mb-1">Metode Pembayaran</span>
                                                    <span className="font-semibold text-gray-800">{selectedTransaction.paymentMethod}</span>
                                                </div>
                                                <div className="bg-gray-50 p-4 rounded-xl hover:bg-gray-100 transition-colors duration-200">
                                                    <span className="text-sm font-medium text-gray-500 block mb-1">Status Transaksi</span>
                                                    <span className={`font-semibold ${selectedTransaction.status === 'success' ? 'text-green-600' :
                                                        selectedTransaction.status === 'pending' ? 'text-yellow-600' :
                                                            'text-red-600'
                                                        }`}>
                                                        {selectedTransaction.status}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Order Details Section */}
                                            <div className="space-y-4">
                                                <div className="bg-gray-50 p-4 rounded-xl hover:bg-gray-100 transition-colors duration-200">
                                                    <span className="text-sm font-medium text-gray-500 block mb-1">Order ID</span>
                                                    <span className="font-mono font-semibold text-gray-800">{selectedTransaction.orderId}</span>
                                                </div>
                                                <div className="bg-gray-50 p-4 rounded-xl hover:bg-gray-100 transition-colors duration-200">
                                                    <span className="text-sm font-medium text-gray-500 block mb-1">Amount</span>
                                                    <span className="font-semibold text-gray-800">Rp {selectedTransaction.amount.toLocaleString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Delivery Information */}
                                {selectedTransaction.deliveryMethod === "delivery" && selectedTransaction.deliveryAddress && (
                                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300">
                                        <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 bg-gradient-to-r from-amber-600 to-amber-800 bg-clip-text text-transparent">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                            </svg>
                                            Informasi Pengiriman
                                        </h3>
                                        <div className="space-y-4">
                                            {/* Delivery Status */}
                                            <div className="bg-gray-50/50 p-4 rounded-xl hover:bg-gray-50 transition-all duration-200 group">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm text-gray-500 group-hover:text-gray-600 transition-colors">Status Pengiriman</span>
                                                    <span className={`font-medium px-3 py-1 rounded-full text-sm capitalize 
                                                        ${selectedTransaction.statusDelivery === 'pending'
                                                            ? 'bg-amber-100 text-amber-800'
                                                            : selectedTransaction.statusDelivery === 'processing'
                                                                ? 'bg-blue-100 text-blue-800'
                                                                : selectedTransaction.statusDelivery === 'shipping'
                                                                    ? 'bg-indigo-100 text-indigo-800'
                                                                    : selectedTransaction.statusDelivery === 'delivery'
                                                                        ? 'bg-purple-100 text-purple-800'
                                                                        : selectedTransaction.statusDelivery === 'completed'
                                                                            ? 'bg-green-100 text-green-800'
                                                                            : selectedTransaction.statusDelivery === 'canceled'
                                                                                ? 'bg-red-100 text-red-800'
                                                                                : 'bg-gray-100 text-gray-800'
                                                        }`}>
                                                        {selectedTransaction.statusDelivery}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Recipient Info */}
                                            <div className="bg-gray-50/50 p-4 rounded-xl hover:bg-gray-50 transition-all duration-200 group">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm text-gray-500 group-hover:text-gray-600 transition-colors">Nama Penerima</span>
                                                    <span className="font-medium text-gray-800 bg-white px-3 py-1 rounded-full shadow-sm border border-gray-100">
                                                        {selectedTransaction.deliveryAddress.fullName}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Phone */}
                                            <div className="bg-gray-50/50 p-4 rounded-xl hover:bg-gray-50 transition-all duration-200 group">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm text-gray-500 group-hover:text-gray-600 transition-colors">Nomor Telepon</span>
                                                    <span className="font-medium text-gray-800 bg-white px-3 py-1 rounded-full shadow-sm border border-gray-100">
                                                        {selectedTransaction.deliveryAddress.phone}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Address */}
                                            <div className="bg-gray-50/50 p-4 rounded-xl hover:bg-gray-50 transition-all duration-200 group">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm text-gray-500 group-hover:text-gray-600 transition-colors">Alamat</span>
                                                    <span className="font-medium text-gray-800 bg-white px-3 py-1 rounded-full shadow-sm border border-gray-100">
                                                        {selectedTransaction.deliveryAddress.streetAddress}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* City & Province */}
                                            <div className="bg-gray-50/50 p-4 rounded-xl hover:bg-gray-50 transition-all duration-200 group">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm text-gray-500 group-hover:text-gray-600 transition-colors">Kota</span>
                                                    <span className="font-medium text-gray-800 bg-white px-3 py-1 rounded-full shadow-sm border border-gray-100">
                                                        {selectedTransaction.deliveryAddress.city}, {selectedTransaction.deliveryAddress.province} {selectedTransaction.deliveryAddress.postalCode}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Additional Info */}
                                            <div className="bg-gray-50/50 p-4 rounded-xl hover:bg-gray-50 transition-all duration-200 group">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm text-gray-500 group-hover:text-gray-600 transition-colors">Catatan Tambahan</span>
                                                    <span className="font-medium text-gray-800 bg-white px-3 py-1 rounded-full shadow-sm border border-gray-100">
                                                        {selectedTransaction.deliveryAddress.details}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Location Map Link */}
                                            <div className="bg-gray-50/50 p-4 rounded-xl hover:bg-gray-50 transition-all duration-200 group">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm text-gray-500 group-hover:text-gray-600 transition-colors">Lokasi</span>
                                                    <a
                                                        href={`https://maps.google.com/?q=${selectedTransaction.deliveryAddress.district}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-indigo-600 hover:text-indigo-700 font-medium text-sm flex items-center gap-1"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        </svg>
                                                        View on Maps
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Links & Actions */}
                                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 w-fit">
                                    <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-800 bg-clip-text text-transparent">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                        Aksi Cepat
                                    </h3>
                                    <div className="flex">
                                        <Link
                                            href={selectedTransaction.linkTransaction}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center justify-center w-full sm:w-auto gap-2 px-8 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl hover:from-indigo-700 hover:to-indigo-800 transition-all duration-300 shadow-sm hover:shadow-indigo-100 hover:shadow-lg transform hover:-translate-y-0.5"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                            </svg>
                                            Lihat Detail Transaksi
                                        </Link>
                                    </div>
                                </div>

                                {/* Timestamps */}
                                <div className="text-sm text-gray-500 flex justify-between pt-4 border-t">
                                    <span>Dibuat: {selectedTransaction.createdAt.toDate().toLocaleString('id-ID')}</span>
                                    <span>Diperbarui: {selectedTransaction.updatedAt.toDate().toLocaleString('id-ID')}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </section>
    )
}
