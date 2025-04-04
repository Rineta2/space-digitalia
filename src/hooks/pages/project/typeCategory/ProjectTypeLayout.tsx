"use client"
import React, { useEffect, useState, Fragment } from 'react'

import { motion } from 'framer-motion'

import { FetchTypeCategory } from '@/hooks/pages/project/typeCategory/lib/FetchTypeCategory'

import { ProjectType } from '@/components/ui/project/types/project'

import ProjectTypeSkelaton from '@/hooks/pages/project/typeCategory/ProjectTypeSkelaton'

import Image from 'next/image'

import { GiSettingsKnobs } from "react-icons/gi";

import ReactPaginate from "react-paginate"

import Link from 'next/link'

import { FaExternalLinkAlt } from 'react-icons/fa'

import { format, formatDistanceToNow, differenceInDays } from 'date-fns'

import { formatSlug } from '@/base/helper/formatSlug'

import { TbEyeShare } from "react-icons/tb";

import { useAuth } from '@/utils/context/AuthContext';

import { useRouter } from 'next/navigation';

import { toast } from 'react-hot-toast';

import { doc, getDoc } from 'firebase/firestore';

import { db } from '@/utils/firebase';

import { LicenseDetail, Address, PaymentData } from '@/hooks/pages/project/project/lib/schema';

export default function ProjectTypeDetails({ typeCategory }: { typeCategory: string }) {
    const [projects, setProjects] = useState<ProjectType[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const [currentPage, setCurrentPage] = useState(0)
    const [selectedType, setSelectedType] = useState<string>('all')
    const [openDropdown, setOpenDropdown] = useState<string | null>(null)
    const [selectedLicense, setSelectedLicense] = useState<{
        title: string;
        price: number;
        licenseTitle: string;
        downloadUrl: string;
        delivery?: string;
        stock?: string;
        sold?: string;
        deliveryDays?: string;
        licenseDetails?: LicenseDetail[];
    } | null>(null)

    const itemsPerPage = 9

    // Add new state for preview modal
    const [isPreviewOpen, setIsPreviewOpen] = useState(false)
    const [selectedPreview, setSelectedPreview] = useState<ProjectType | null>(null)

    // Add new state
    const [isProcessing, setIsProcessing] = useState(false);
    const [deliveryMethod, setDeliveryMethod] = useState<'download' | 'delivery' | ''>('');
    const [defaultAddress, setDefaultAddress] = useState<Address | null>(null);

    // Add hooks
    const { user } = useAuth();
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = FetchTypeCategory(typeCategory, (data) => {
            try {
                setProjects([...data].sort((a, b) => {
                    // Add type checking and error handling for dates
                    const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
                    const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);

                    return dateB.getTime() - dateA.getTime(); // Sort in descending order
                }));
                setIsLoading(false);
            } catch (error) {
                console.error('Error sorting projects:', error);
                setProjects(data); // Use unsorted data if sorting fails
                setIsLoading(false);
            }
        })

        return () => unsubscribe()
    }, [typeCategory])

    // Fix the types array filtering logic
    const types = Array.from(new Set(projects
        .filter(item => item.typeTitle)  // Only filter for existence of typeTitle
        .map(item => item.typeTitle)
    ));

    // Fix the filter logic for projects
    const filteredProjects = projects.filter(item => {
        const typeMatch = selectedType === 'all' ||
            (item.typeTitle && item.typeTitle.toLowerCase() === selectedType.toLowerCase());

        const licenseMatch = !selectedLicense ||
            (item.licenseTitle && selectedLicense.licenseTitle &&
                item.licenseTitle.toLowerCase() === selectedLicense.licenseTitle.toLowerCase());

        return typeMatch && licenseMatch;
    });

    const filteredProductsCount = filteredProjects.length;

    // Add pagination logic
    const getFilteredAndSortedProjects = () => {
        const result = filteredProjects;
        const offset = currentPage * itemsPerPage;
        return result.slice(offset, offset + itemsPerPage);
    }

    const license = Array.from(new Set(projects.map(item => item.licenseTitle)))

    // Handle click outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (!(event.target as Element).closest('.dropdown')) {
                setOpenDropdown(null)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Add pagination handler
    const handlePageChange = ({ selected }: { selected: number }) => {
        setCurrentPage(selected)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const pageCount = Math.ceil(filteredProjects.length / itemsPerPage)

    // Add preview handlers
    const handlePreviewOpen = (project: ProjectType) => {
        setSelectedPreview(project)
        setIsPreviewOpen(true)
        setSelectedLicense(null)
    }

    const handlePreviewClose = () => {
        setIsPreviewOpen(false)
        setSelectedPreview(null)
        setSelectedLicense(null)
    }

    // Add effect to prevent background scroll when modal is open
    useEffect(() => {
        if (isPreviewOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'unset'
        }

        return () => {
            document.body.style.overflow = 'unset'
        }
    }, [isPreviewOpen])

    // Add useEffect to fetch default address
    useEffect(() => {
        const fetchDefaultAddress = async () => {
            if (deliveryMethod === 'delivery' && user?.uid) {
                const userDoc = doc(db, process.env.NEXT_PUBLIC_COLLECTIONS_ACCOUNTS!, user.uid);
                const userSnap = await getDoc(userDoc);

                if (userSnap.exists()) {
                    const addresses: Address[] = userSnap.data().addresses || [];
                    const defaultAddr = addresses.find(addr => addr.isDefault);
                    setDefaultAddress(defaultAddr || null);
                }
            }
        };

        fetchDefaultAddress();
    }, [deliveryMethod, user?.uid]);

    // Add transaction handlers
    const handlePayment = async () => {
        try {
            if (!user || !user.uid || !user.email || !user.displayName) {
                localStorage.setItem('redirectAfterLogin', window.location.pathname);
                router.push('/auth/signin');
                toast.error('Please sign in with complete profile information');
                return;
            }

            if (!selectedPreview || !selectedPreview.id || !selectedPreview.title) {
                toast.error('Invalid project selection');
                return;
            }

            if (!selectedLicense || !selectedLicense.title || !selectedLicense.price) {
                toast.error('Please select a valid license type');
                return;
            }

            if (!deliveryMethod) {
                toast.error('Please select a delivery method');
                return;
            }

            if (deliveryMethod === 'delivery' && !defaultAddress) {
                toast.error('No default delivery address found. Please add an address in your profile.');
                return;
            }

            setIsProcessing(true);

            const paymentData: PaymentData = {
                projectId: selectedPreview.id,
                userId: user.uid,
                amount: Math.round(selectedLicense.price),
                projectTitle: selectedPreview.title,
                licenseType: selectedLicense.title,
                deliveryMethod: deliveryMethod,
                userEmail: user.email,
                userName: user.displayName,
                imageUrl: selectedPreview.imageUrl,
                userPhotoURL: user?.photoURL ?? null,
                downloadUrl: deliveryMethod === 'download' ? selectedLicense.downloadUrl : undefined,
                ...(deliveryMethod === 'delivery' && defaultAddress && {
                    deliveryAddress: {
                        fullName: defaultAddress.fullName,
                        phone: defaultAddress.phone,
                        province: defaultAddress.province,
                        city: defaultAddress.city,
                        district: defaultAddress.district,
                        streetAddress: defaultAddress.streetAddress,
                        details: defaultAddress.details,
                        postalCode: defaultAddress.postalCode,
                    }
                })
            };

            const response = await fetch('/api/payment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(paymentData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || data.details || 'Failed to create payment transaction');
            }

            if (!data.token || !data.transactionId) {
                throw new Error('Invalid payment token or transaction ID received');
            }

            if (typeof window.snap === 'undefined') {
                throw new Error('Payment system not initialized');
            }

            window.snap.pay(data.token, {
                onSuccess: async (result) => {
                    try {
                        const updateResponse = await fetch('/api/payment/update-status', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                orderId: data.orderId,
                                status: 'success',
                                transactionId: result.transaction_id,
                                paymentDetails: result
                            }),
                        });

                        if (!updateResponse.ok) {
                            toast.error('Failed to update payment status', {
                                duration: 3000
                            });
                            return;
                        }

                        const successToast = toast.success('Payment successful!', {
                            duration: 3000
                        });

                        await new Promise(resolve => setTimeout(resolve, 3000));
                        toast.dismiss(successToast);
                        window.location.href = `/payment/status/${data.transactionId}`;

                    } catch {
                        const errorToast = toast.error('Failed to update payment status', {
                            duration: 3000
                        });
                        await new Promise(resolve => setTimeout(resolve, 3000));
                        toast.dismiss(errorToast);
                        window.location.href = `/payment/status/${data.transactionId}`;
                    }
                },
                onPending: async (result) => {
                    try {
                        const updateResponse = await fetch('/api/payment/update-status', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                orderId: data.orderId,
                                status: 'pending',
                                transactionId: result.transaction_id,
                                paymentDetails: result
                            }),
                        });

                        if (!updateResponse.ok) {
                            toast.error('Failed to update payment status', {
                                duration: 3000
                            });
                            return;
                        }

                        const pendingToast = toast.loading('Payment is pending...', {
                            duration: 3000
                        });

                        await new Promise(resolve => setTimeout(resolve, 3000));
                        toast.dismiss(pendingToast);
                        window.location.href = `/payment/status/${data.transactionId}`;

                    } catch {
                        const errorToast = toast.error('Failed to update payment status', {
                            duration: 3000
                        });
                        await new Promise(resolve => setTimeout(resolve, 3000));
                        toast.dismiss(errorToast);
                        window.location.href = `/payment/status/${data.transactionId}`;
                    }
                },
                onError: async (result) => {
                    try {
                        const updateResponse = await fetch('/api/payment/update-status', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                orderId: data.orderId,
                                status: 'failure',
                                transactionId: result.transaction_id,
                                paymentDetails: result
                            }),
                        });

                        if (!updateResponse.ok) {
                            toast.error('Failed to update payment status', {
                                duration: 3000
                            });
                            return;
                        }

                        const errorToast = toast.error(`Payment failed: ${result.status_message || 'Unknown error'}`, {
                            duration: 3000
                        });

                        await new Promise(resolve => setTimeout(resolve, 3000));
                        toast.dismiss(errorToast);
                        window.location.href = `/payment/status/${data.transactionId}`;

                    } catch {
                        const errorToast = toast.error('Failed to update payment status', {
                            duration: 3000
                        });
                        await new Promise(resolve => setTimeout(resolve, 3000));
                        toast.dismiss(errorToast);
                        window.location.href = `/payment/status/${data.transactionId}`;
                    }
                },
                onClose: () => {
                    setIsProcessing(false);
                    toast.dismiss();
                },
            });
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Payment processing failed');
            setIsProcessing(false);
        }
    };

    const handleFreeTransaction = async () => {
        try {
            if (!selectedPreview || !selectedLicense || !deliveryMethod || !user) {
                toast.error('Please complete all required selections');
                return;
            }

            setIsProcessing(true);

            // Call processFreeTransaction
            await processFreeTransaction();

        } catch (error) {
            toast.error('Failed to process transaction');
            console.error('Free transaction error:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    // Update processFreeTransaction
    const processFreeTransaction = async () => {
        try {
            if (!selectedPreview || !selectedLicense || !user) {
                toast.error('Missing required information');
                return;
            }

            setIsProcessing(true);

            const response = await fetch('/api/free-transaction', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    projectId: selectedPreview.id,
                    userId: user.uid,
                    projectTitle: selectedPreview.title,
                    licenseType: selectedLicense.licenseTitle || selectedLicense.title,
                    deliveryMethod,
                    imageUrl: selectedPreview.imageUrl,
                    userEmail: user.email,
                    userName: user.displayName,
                    userPhotoURL: user.photoURL ?? null,
                    deliveryAddress: deliveryMethod === 'delivery' ? defaultAddress : null,
                }),
            });

            const data = await response.json();

            if (data.success) {
                toast.success('Transaction successful!');
                router.push(data.redirectUrl);
            } else {
                throw new Error(data.error || 'Transaction failed');
            }
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to process transaction');
            console.error('Free transaction error:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleTransaction = () => {
        if (selectedLicense?.price === 0) {
            handleFreeTransaction();
        } else {
            handlePayment();
        }
    };

    // Add Midtrans script when modal is opened
    useEffect(() => {
        if (isPreviewOpen) {
            const midtransScriptUrl = 'https://app.sandbox.midtrans.com/snap/snap.js';
            const midtransClientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY;

            const scriptElement = document.createElement('script');
            scriptElement.src = midtransScriptUrl;
            scriptElement.setAttribute('data-client-key', midtransClientKey || '');

            document.body.appendChild(scriptElement);

            return () => {
                document.body.removeChild(scriptElement);
            };
        }
    }, [isPreviewOpen]);

    // Reset processing state when component unmounts
    useEffect(() => {
        return () => {
            setIsProcessing(false);
        };
    }, []);

    if (isLoading) {
        return <ProjectTypeSkelaton />
    }

    return (
        <Fragment>
            <section className="min-h-full py-24 bg-gradient-to-b from-gray-50/40 via-white to-white relative">
                <div className="container px-4 xl:px-10 mx-auto max-w-[1400px]">
                    <div className='absolute top-0 left-0 right-0 mx-4 md:mx-8 lg:mx-auto lg:max-w-6xl 
                            py-6 md:py-8 px-4 md:px-8 
                            bg-white/80 backdrop-blur-xl rounded-3xl shadow-lg border border-gray-100/50 
                            transform -translate-y-1/2 z-10'>
                        <div className="flex flex-col items-start justify-start w-full gap-4 md:gap-6">
                            {/* Filter Buttons Group */}
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full flex-wrap">
                                {/* Filter Group */}
                                <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-3">
                                    {/* Category Filter */}
                                    <div className="dropdown relative w-fit sm:w-auto">
                                        <button
                                            className="w-full sm:w-auto flex items-center justify-between sm:justify-start gap-3 px-4 py-2.5 rounded-xl
                                                bg-gray-50/80 hover:bg-gray-100 active:bg-gray-200
                                                transition-all duration-300 ease-in-out">
                                            <div className="flex items-center gap-2">
                                                <GiSettingsKnobs className='text-lg text-gray-600' />
                                                <span className='text-sm font-medium text-gray-700'>
                                                    {typeCategory}
                                                </span>
                                            </div>
                                        </button>
                                    </div>

                                    {/* Type Filter */}
                                    <div className="dropdown relative w-fit sm:w-auto">
                                        <button
                                            onClick={() => setOpenDropdown(openDropdown === 'type' ? null : 'type')}
                                            className="w-full sm:w-auto flex items-center justify-between sm:justify-start gap-3 px-4 py-2.5 rounded-xl
                                                bg-gray-50/80 hover:bg-gray-100 active:bg-gray-200
                                                transition-all duration-300 ease-in-out">
                                            <div className="flex items-center gap-2">
                                                <GiSettingsKnobs className='text-lg text-gray-600' />
                                                <span className='text-sm font-medium text-gray-700 capitalize'>
                                                    {selectedType === 'all' ? 'All Types' : selectedType}
                                                </span>
                                            </div>
                                        </button>

                                        <div className={`dropdown-content absolute z-50 mt-2 bg-white/95 backdrop-blur-md 
                                                rounded-xl shadow-xl border border-gray-100/50 p-2 
                                                w-full sm:w-[260px]
                                                transform origin-top transition-all duration-300
                                                ${openDropdown === 'type' ? 'scale-100 opacity-100 visible' : 'scale-95 opacity-0 invisible'}`}>
                                            <button
                                                onClick={() => setSelectedType('all')}
                                                className={`flex items-center gap-2 w-full text-left px-4 py-3 text-sm 
                                                        rounded-xl transition-all duration-300 
                                                        ${selectedType === 'all'
                                                        ? 'bg-blue-600 text-white font-medium shadow-md'
                                                        : 'hover:bg-gray-50 text-gray-700 hover:text-gray-900'
                                                    }`}
                                            >
                                                All Types
                                            </button>
                                            {types.map((type) => (
                                                <button
                                                    key={type}
                                                    onClick={() => setSelectedType(type)}
                                                    className={`flex items-center gap-2 w-full text-left px-4 py-3 text-sm 
                                                            rounded-xl transition-all duration-300 capitalize
                                                            ${selectedType === type
                                                            ? 'bg-blue-600 text-white font-medium shadow-md'
                                                            : 'hover:bg-gray-50 text-gray-700 hover:text-gray-900'
                                                        }`}
                                                >
                                                    {type}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* License Filter */}
                                    <div className="dropdown relative w-fit sm:w-auto">
                                        <button
                                            onClick={() => setOpenDropdown(openDropdown === 'license' ? null : 'license')}
                                            className="w-full sm:w-auto flex items-center justify-between sm:justify-start gap-3 px-4 py-2.5 rounded-xl
                                                bg-gray-50/80 hover:bg-gray-100 active:bg-gray-200
                                                transition-all duration-300 ease-in-out">
                                            <div className="flex items-center gap-2">
                                                <GiSettingsKnobs className='text-lg text-gray-600' />
                                                <span className='text-sm font-medium text-gray-700'>
                                                    {selectedLicense === null ? 'All Licenses' : selectedLicense.title}
                                                </span>
                                            </div>
                                        </button>

                                        <div className={`dropdown-content absolute z-50 mt-2 bg-white/95 backdrop-blur-md 
                                                rounded-xl shadow-xl border border-gray-100/50 p-2 
                                                w-full sm:w-[260px]
                                                transform origin-top transition-all duration-300
                                                ${openDropdown === 'license' ? 'scale-100 opacity-100 visible' : 'scale-95 opacity-0 invisible'}`}>
                                            <button
                                                onClick={() => setSelectedLicense(null)}
                                                className={`flex items-center gap-2 w-full text-left px-4 py-3 text-sm 
                                                        rounded-xl transition-all duration-300
                                                        ${selectedLicense === null
                                                        ? 'bg-blue-600 text-white font-medium shadow-md'
                                                        : 'hover:bg-gray-50 text-gray-700 hover:text-gray-900'
                                                    }`}
                                            >
                                                All Licenses
                                            </button>
                                            {license.map((lic) => (
                                                <button
                                                    key={lic}
                                                    onClick={() => setSelectedLicense({
                                                        title: lic,
                                                        price: 0,
                                                        licenseTitle: lic,
                                                        downloadUrl: ''
                                                    })}
                                                    className={`flex items-center gap-2 w-full text-left px-4 py-3 text-sm 
                                                            rounded-xl transition-all duration-300 capitalize
                                                            ${selectedLicense?.licenseTitle === lic
                                                            ? 'bg-blue-600 text-white font-medium shadow-md'
                                                            : 'hover:bg-gray-50 text-gray-700 hover:text-gray-900'
                                                        }`}
                                                >
                                                    {lic}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Products Counter Badge */}
                                <div className='text-sm font-medium text-gray-700 bg-gray-50/80 
                                        px-4 py-2.5 rounded-xl flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-start'>
                                    <span className="h-2 w-2 rounded-full bg-green-500"></span>
                                    <p className='capitalize'>Showing {filteredProductsCount} Project With Category {typeCategory}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 mt-5'>
                        {getFilteredAndSortedProjects().map((item) => {
                            // Add safe date handling
                            const createdDate = item.createdAt ? new Date(item.createdAt) : null;
                            const isValidDate = createdDate && !isNaN(createdDate.getTime());

                            return (
                                <div key={item.id} className='group bg-white rounded-3xl shadow-sm 
                                    hover:shadow-xl overflow-hidden transition-all duration-500 
                                    border border-gray-100/50 hover:border-gray-200
                                    hover:-translate-y-1 hover:scale-[1.02]'>
                                    <div className='relative aspect-[16/10] overflow-hidden'>
                                        <Image
                                            src={item.imageUrl}
                                            alt={item.title}
                                            width={500}
                                            height={500}
                                            className='object-cover w-full h-full transform 
                                                group-hover:scale-110 transition-transform duration-700 ease-out'
                                        />

                                        {/* Category Badge */}
                                        <div className="absolute top-4 left-4 px-4 py-2 
                                            bg-white/90 backdrop-blur-md text-gray-800 
                                            capitalize rounded-xl text-sm font-medium 
                                            shadow-sm border border-gray-100/50
                                            hover:bg-white hover:shadow-md transition-all duration-300">
                                            {item.typeCategory}
                                        </div>

                                        {/* Status Badge */}
                                        <div className={`absolute top-4 right-4 px-4 py-2 
                                            ${item.statusProject === 'development'
                                                ? 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30'
                                                : 'bg-green-500/20 text-green-600 border-green-500/30'} 
                                            backdrop-blur-md capitalize rounded-xl text-sm font-medium 
                                            shadow-sm border transition-all duration-300
                                            hover:shadow-md flex items-center gap-2`}>
                                            {item.statusProject === 'development' ? (
                                                <>
                                                    <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></span>
                                                    Development
                                                </>
                                            ) : (
                                                <>
                                                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                                    Finished
                                                </>
                                            )}
                                        </div>

                                        {/* Modern Overlay with Glassmorphism */}
                                        <div className="overlay absolute inset-0 
                                            bg-gradient-to-t from-black/90 via-black/50 to-transparent 
                                            flex items-center justify-center opacity-0 
                                            group-hover:opacity-100 transition-all duration-500">
                                            <div className="flex items-center gap-8">
                                                <button
                                                    onClick={() => handlePreviewOpen(item)}
                                                    className='flex items-center flex-col gap-3 hover:scale-110 transition-all duration-300 transform -translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100'
                                                >
                                                    <span className='p-4 rounded-full bg-white/20 backdrop-blur-xl hover:bg-white/40 transition-colors duration-300 shadow-lg'>
                                                        <TbEyeShare className='text-2xl text-white' />
                                                    </span>
                                                    <p className='text-sm text-white font-medium tracking-wide'>Preview</p>
                                                </button>

                                                <Link href={`/project/${formatSlug(item.typeCategory)}/${item.slug}`}
                                                    className='flex items-center flex-col gap-3 hover:scale-110 transition-all duration-300 transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100'>
                                                    <span className='p-4 rounded-full bg-white/20 backdrop-blur-xl hover:bg-white/40 transition-colors duration-300 shadow-lg'>
                                                        <FaExternalLinkAlt className='text-xl text-white' />
                                                    </span>
                                                    <p className='text-sm text-white font-medium tracking-wide'>Details</p>
                                                </Link>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Card Content */}
                                    <div className="p-6 space-y-4">
                                        {/* Title with improved hover effect */}
                                        <h3 className='text-lg font-semibold text-gray-900 
                                            group-hover:text-blue-600 transition-all duration-300 
                                            hover:tracking-wide'>
                                            {item.title}
                                        </h3>

                                        {/* Description */}
                                        <p className='text-gray-600 text-sm line-clamp-2'>
                                            {item.description}
                                        </p>

                                        {/* Date with subtle background and error handling */}
                                        <span className='inline-block text-sm text-gray-500 
                                            bg-gray-50 px-3 py-1.5 rounded-lg'>
                                            {isValidDate ? (
                                                differenceInDays(new Date(), createdDate) < 30
                                                    ? formatDistanceToNow(createdDate, { addSuffix: true })
                                                    : format(createdDate, 'MMMM d, yyyy')
                                            ) : (
                                                'Date not available'
                                            )}
                                        </span>

                                        {/* Modernized Author Info Card */}
                                        <div className='flex items-center gap-4 
                                            bg-gradient-to-r from-gray-50/80 to-gray-50/40
                                            backdrop-blur-sm rounded-2xl p-4 
                                            border border-gray-100/80
                                            hover:border-blue-100/80
                                            hover:from-blue-50/40 hover:to-white
                                            transition-all duration-300 ease-in-out
                                            shadow-sm hover:shadow-md'>
                                            <div className='relative w-12 h-12 rounded-full overflow-hidden 
                                                ring-2 ring-white/80 ring-offset-2 ring-offset-gray-50/40
                                                shadow-sm transform 
                                                group-hover:scale-105 transition-all duration-300'>
                                                <Image
                                                    src={item.author.photoURL}
                                                    alt={item.author.name}
                                                    fill
                                                    className='object-cover'
                                                />
                                            </div>

                                            <div className='flex flex-col gap-1'>
                                                <h3 className='text-sm font-semibold text-gray-900 
                                                    group-hover:text-blue-700 transition-colors duration-300'>
                                                    {item.author.name}
                                                </h3>
                                                <p className='text-xs text-gray-500 group-hover:text-gray-600'>
                                                    {item.author.role}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Pagination */}
                    {pageCount > 1 && (
                        <div className="mt-12 flex flex-col sm:flex-row gap-4 px-4 xl:px-10 justify-between items-center">
                            {/* Page indicator */}
                            <div className="text-sm font-medium text-gray-600">
                                Page {currentPage + 1} of {pageCount}
                            </div>

                            <ReactPaginate
                                previousLabel={
                                    <span className="flex items-center gap-1">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                        </svg>
                                        Previous
                                    </span>
                                }
                                nextLabel={
                                    <span className="flex items-center gap-1">
                                        Next
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </span>
                                }
                                breakLabel="..."
                                pageCount={pageCount}
                                marginPagesDisplayed={2}
                                pageRangeDisplayed={3}
                                onPageChange={handlePageChange}
                                containerClassName="flex items-center justify-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-2xl shadow-sm border border-gray-100/50"
                                pageClassName="rounded-xl overflow-hidden"
                                pageLinkClassName="px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-all duration-300"
                                previousClassName="rounded-xl overflow-hidden"
                                previousLinkClassName="px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-all duration-300 flex items-center"
                                nextClassName="rounded-xl overflow-hidden"
                                nextLinkClassName="px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-all duration-300 flex items-center"
                                breakClassName="px-4 py-2 text-sm font-medium text-gray-700"
                                activeClassName="bg-blue-600 text-white hover:bg-blue-700"
                                activeLinkClassName="!text-white hover:!text-white hover:!bg-transparent"
                            />
                        </div>
                    )}
                </div>
            </section>

            {/* Add Preview Modal */}
            {isPreviewOpen && selectedPreview && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/95 backdrop-blur-md z-[999] scrollbar-thin scrollbar-track-gray-800/40 scrollbar-thumb-gray-600/40"
                    onClick={handlePreviewClose}
                    style={{ position: 'fixed' }}
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        transition={{ type: "spring", duration: 0.5 }}
                        className="container mx-auto min-h-screen p-4 md:p-6 lg:p-8 flex items-center justify-center"
                        onClick={(e) => {
                            e.stopPropagation();
                            if (e.target === e.currentTarget) {
                                handlePreviewClose();
                            }
                        }}
                    >
                        <div className="relative w-full max-w-7xl bg-gradient-to-b from-gray-900/80 to-black/80 rounded-2xl shadow-2xl border border-gray-800/50 backdrop-blur-xl">
                            {/* URL Bar */}
                            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-800/50 overflow-x-auto sm:overflow-x-hidden scrollbar-none">
                                <div className="flex gap-2">
                                    <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                                    <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                                    <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                                </div>
                                <div className="flex-1 flex items-center gap-2">
                                    <div className="flex-1 flex items-center px-4 py-1.5 bg-gray-900/50 rounded-lg border border-gray-700/50">
                                        <div className="flex items-center gap-2 text-gray-400 text-sm">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                                            </svg>
                                            <span className="opacity-75 truncate">{selectedPreview.linkPreview}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="max-h-[85vh] overflow-y-auto scrollbar-thin scrollbar-track-gray-800/40 scrollbar-thumb-gray-600/40">
                                {/* Hero Image */}
                                <div className="relative aspect-video w-full overflow-hidden">
                                    <Image
                                        src={selectedPreview.imageUrl}
                                        alt={selectedPreview.title}
                                        fill
                                        className="object-cover"
                                        priority
                                        sizes="(max-width: 1280px) 100vw, 1280px"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
                                </div>

                                {/* Gallery Grid */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 md:p-6">
                                    {selectedPreview.images.map((image, index) => (
                                        <motion.div
                                            key={index}
                                            whileHover={{ scale: 1.02 }}
                                            className="relative aspect-video rounded-xl overflow-hidden group"
                                        >
                                            <Image
                                                src={image}
                                                alt={`${selectedPreview.title} - ${index + 1}`}
                                                fill
                                                className="object-cover transition-transform duration-500 group-hover:scale-110"
                                                sizes="(max-width: 768px) 50vw, (max-width: 1280px) 25vw, 320px"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
                                        </motion.div>
                                    ))}
                                </div>

                                {/* Content Section with Glass Morphism */}
                                <div className="grid md:grid-cols-2 gap-6 md:gap-8 p-4 md:p-6 bg-gradient-to-b from-gray-900/60 to-black/60 backdrop-blur-md">
                                    {/* Left Column */}
                                    <div className="space-y-6">
                                        {/* Author Info with Glass Effect */}
                                        <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-800/20 border border-gray-700/30 backdrop-blur-md">
                                            <Image
                                                src={selectedPreview.author.photoURL}
                                                alt={selectedPreview.author.name}
                                                width={56}
                                                height={56}
                                                className="rounded-full ring-2 ring-indigo-500/30"
                                            />
                                            <div>
                                                <h3 className="text-lg text-white font-medium">{selectedPreview.author.name}</h3>
                                                <p className="text-sm text-gray-400 capitalize">{selectedPreview.author.role}</p>
                                            </div>
                                        </div>

                                        {/* Description and Details */}
                                        <div className="space-y-4 p-4 rounded-xl bg-gray-800/20 border border-gray-700/30">
                                            <h3 className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
                                                Description
                                            </h3>
                                            <p className="text-gray-300 leading-relaxed">
                                                {selectedPreview.description}
                                            </p>
                                        </div>

                                        <div className="space-y-4 p-4 rounded-xl bg-gray-800/20 border border-gray-700/30">
                                            <h3 className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
                                                Details
                                            </h3>
                                            <div
                                                className="prose prose-invert max-w-none
                                                /* Headings */
                                                prose-h1:text-2xl prose-h1:font-bold prose-h1:text-white prose-h1:mb-6
                                                prose-h3:text-lg prose-h3:font-semibold prose-h3:text-cyan-400 prose-h3:mt-8 prose-h3:mb-4
                                                
                                                /* Paragraphs */
                                                prose-p:text-gray-300 prose-p:leading-relaxed prose-p:mb-6
                                                
                                                /* Strong/Bold */
                                                prose-strong:text-white prose-strong:font-semibold
                                                
                                                /* Lists */
                                                prose-ol:mt-4 prose-ol:mb-6 prose-ol:space-y-3
                                                prose-li:text-gray-300 prose-li:leading-relaxed
                                                [&_li_strong]:text-cyan-400
                                                
                                                /* List Bullets */
                                                [&_li[data-list='bullet']]:relative
                                                [&_li[data-list='bullet']]:pl-6
                                                [&_li[data-list='bullet']]:before:content-['']
                                                [&_li[data-list='bullet']]:before:absolute
                                                [&_li[data-list='bullet']]:before:left-0
                                                [&_li[data-list='bullet']]:before:top-[0.6em]
                                                [&_li[data-list='bullet']]:before:h-2
                                                [&_li[data-list='bullet']]:before:w-2
                                                [&_li[data-list='bullet']]:before:rounded-full
                                                [&_li[data-list='bullet']]:before:bg-cyan-400/60
                                                
                                                /* Remove ql-ui elements */
                                                [&_.ql-ui]:hidden"
                                                dangerouslySetInnerHTML={{ __html: selectedPreview.content }}
                                            />
                                        </div>
                                    </div>

                                    {/* Right Column */}
                                    <div className="space-y-6">
                                        {/* Technologies */}
                                        <div className="p-4 rounded-xl bg-gray-800/20 border border-gray-700/30">
                                            <h3 className="text-xl font-semibold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
                                                Technologies
                                            </h3>
                                            <div className="flex flex-wrap gap-2">
                                                {selectedPreview.frameworks?.map((fw, index) => (
                                                    <div
                                                        key={index}
                                                        className="flex items-center gap-2 bg-gray-800/40 backdrop-blur-sm rounded-lg px-3 py-2 border border-gray-700/30 hover:border-indigo-500/50 transition-all duration-300 hover:scale-105"
                                                    >
                                                        <Image
                                                            src={fw.imageUrl}
                                                            alt={fw.title}
                                                            width={20}
                                                            height={20}
                                                            className="rounded-full"
                                                        />
                                                        <span className="text-gray-300 text-sm">{fw.title}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Stats Grid */}
                                        <div className="grid grid-cols-2 gap-4">
                                            {[
                                                { label: "Downloads", value: selectedPreview.downloads },
                                                { label: "Stock", value: selectedPreview.stock },
                                                { label: "Sold", value: selectedPreview.sold },
                                                { label: "Delivery", value: `${selectedPreview.delivery}` }
                                            ].map((stat, index) => (
                                                <div key={index} className="bg-gray-800/30 backdrop-blur-sm p-4 rounded-lg border border-gray-700/30 hover:border-indigo-500/30 transition-all duration-300">
                                                    <p className="text-gray-400">{stat.label}</p>
                                                    <p className="text-xl font-semibold text-white">{stat.value}</p>
                                                </div>
                                            ))}
                                        </div>

                                        {/* License Options */}
                                        <div className="space-y-6">
                                            {/* License Selection Header */}
                                            <div className="bg-gradient-to-r from-gray-800/40 to-gray-800/20 backdrop-blur-lg rounded-2xl p-6 border border-gray-700/30">
                                                <h2 className="text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-indigo-400">
                                                    License Type
                                                </h2>
                                                <p className="text-sm text-gray-400 mt-1">Choose the perfect license for your needs</p>
                                            </div>

                                            {/* License Selector */}
                                            <div className="relative group">
                                                <select
                                                    className="w-full appearance-none bg-gray-800/30 backdrop-blur-md
                                                        border-2 border-gray-700/30 group-hover:border-indigo-500/50
                                                        rounded-2xl p-5 pr-12 transition-all duration-300 ease-out
                                                        text-gray-300 font-medium
                                                        focus:outline-none focus:ring-2 focus:ring-indigo-500/20
                                                        cursor-pointer"
                                                    defaultValue=""
                                                    onChange={(e) => {
                                                        const selected = selectedPreview.licenseDetails.find(
                                                            item => item.title === e.target.value
                                                        );
                                                        if (selected) {
                                                            setSelectedLicense({
                                                                title: selected.title,
                                                                price: selected.price,
                                                                licenseTitle: selected.title,
                                                                downloadUrl: selected.downloadUrl
                                                            });
                                                        } else {
                                                            setSelectedLicense(null);
                                                        }
                                                        setDeliveryMethod('');
                                                    }}
                                                >
                                                    <option value="" disabled className="text-gray-500">Select License Type</option>
                                                    {selectedPreview.licenseDetails.map((item) => (
                                                        <option
                                                            key={item.title}
                                                            value={item.title}
                                                            className="bg-gray-900 text-gray-300 py-2"
                                                        >
                                                            {item.title} - Rp. {item.price.toLocaleString()}
                                                        </option>
                                                    ))}
                                                </select>

                                                {/* Animated dropdown arrow */}
                                                <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none">
                                                    <div className="p-2 rounded-xl bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 group-hover:from-cyan-500/30 group-hover:to-indigo-500/30 transition-all duration-300">
                                                        <svg className="w-5 h-5 text-cyan-400 group-hover:text-cyan-300 transition-colors duration-300"
                                                            fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                        </svg>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Selected License Details */}
                                            {selectedLicense && (
                                                <div className="space-y-6 animate-in fade-in-50 duration-500">
                                                    {/* License Card */}
                                                    <div className="bg-gradient-to-br from-gray-800/40 to-gray-800/20 backdrop-blur-xl 
                                                        rounded-2xl p-6 border-2 border-gray-700/30 hover:border-indigo-500/30 
                                                        transition-all duration-300 group">
                                                        <div className="flex items-center justify-between mb-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="p-2 rounded-xl bg-gradient-to-r from-cyan-500/20 to-indigo-500/20">
                                                                    <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                                            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                                                    </svg>
                                                                </div>
                                                                <span className="text-sm font-medium text-cyan-400">Selected License</span>
                                                            </div>
                                                            <span className="text-xs px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-400 font-medium">
                                                                #{selectedLicense.title}
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between items-baseline">
                                                            <div className="space-y-1">
                                                                <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-indigo-400">
                                                                    Rp. {selectedLicense.price.toLocaleString()}
                                                                </span>
                                                                <p className="text-xs text-gray-400">Includes all applicable taxes</p>
                                                            </div>
                                                            <div className="p-3 rounded-xl bg-gradient-to-r from-cyan-500/10 to-indigo-500/10 
                                                                group-hover:from-cyan-500/20 group-hover:to-indigo-500/20 transition-all duration-300">
                                                                <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                </svg>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Delivery Method Selection */}
                                                    <div className={`grid ${selectedPreview.licenseTitle.toLowerCase() === 'free' ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}>
                                                        <button
                                                            onClick={() => setDeliveryMethod('download')}
                                                            className={`group relative overflow-hidden rounded-2xl border-2 transition-all duration-300
                                                                ${deliveryMethod === 'download'
                                                                    ? 'bg-gradient-to-br from-cyan-500 to-indigo-500 border-transparent'
                                                                    : 'bg-gray-800/30 border-gray-700/30 hover:border-indigo-500/50'
                                                                }`}
                                                        >
                                                            <div className="relative z-10 p-5">
                                                                <div className="flex flex-col items-center gap-3">
                                                                    <div className={`p-3 rounded-xl ${deliveryMethod === 'download'
                                                                        ? 'bg-white/20'
                                                                        : 'bg-gradient-to-r from-cyan-500/20 to-indigo-500/20'
                                                                        } transition-colors duration-300`}>
                                                                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                                                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                                        </svg>
                                                                    </div>
                                                                    <div className="text-center">
                                                                        <p className={`text-sm font-medium ${deliveryMethod === 'download' ? 'text-white' : 'text-gray-300'}`}>
                                                                            Download
                                                                        </p>
                                                                        <p className={`text-xs mt-1 ${deliveryMethod === 'download' ? 'text-white/80' : 'text-gray-400'}`}>
                                                                            Instant access
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 
                                                                opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                                        </button>

                                                        {selectedPreview.licenseTitle.toLowerCase() !== 'free' && (
                                                            <button
                                                                onClick={() => setDeliveryMethod('delivery')}
                                                                className={`group relative overflow-hidden rounded-2xl border-2 transition-all duration-300
                                                                    ${deliveryMethod === 'delivery'
                                                                        ? 'bg-gradient-to-br from-cyan-500 to-indigo-500 border-transparent'
                                                                        : 'bg-gray-800/30 border-gray-700/30 hover:border-indigo-500/50'
                                                                    }`}
                                                            >
                                                                <div className="relative z-10 p-5">
                                                                    <div className="flex flex-col items-center gap-3">
                                                                        <div className={`p-3 rounded-xl ${deliveryMethod === 'delivery'
                                                                            ? 'bg-white/20'
                                                                            : 'bg-gradient-to-r from-cyan-500/20 to-indigo-500/20'
                                                                            } transition-colors duration-300`}>
                                                                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                                                    d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                                                                            </svg>
                                                                        </div>
                                                                        <div className="text-center">
                                                                            <p className={`text-sm font-medium ${deliveryMethod === 'delivery' ? 'text-white' : 'text-gray-300'}`}>
                                                                                Delivery
                                                                            </p>
                                                                            <p className={`text-xs mt-1 ${deliveryMethod === 'delivery' ? 'text-white/80' : 'text-gray-400'}`}>
                                                                                3-5 days delivery
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 
                                                                    opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                                            </button>
                                                        )}
                                                    </div>

                                                    {/* Delivery Address Section */}
                                                    {deliveryMethod === 'delivery' && (
                                                        <div className="space-y-4 p-6 rounded-2xl bg-gradient-to-br from-gray-800/40 to-gray-800/20 backdrop-blur-xl border-2 border-gray-700/30 hover:border-indigo-500/30 transition-all duration-300">
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="p-2 rounded-xl bg-gradient-to-r from-cyan-500/20 to-indigo-500/20">
                                                                        <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                        </svg>
                                                                    </div>
                                                                    <span className="text-sm font-medium text-cyan-400">Delivery Address</span>
                                                                </div>
                                                                {defaultAddress && (
                                                                    <Link
                                                                        href="/account/address"
                                                                        className="text-xs px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-400 font-medium hover:bg-indigo-500/30 transition-colors duration-300"
                                                                    >
                                                                        Change Address
                                                                    </Link>
                                                                )}
                                                            </div>

                                                            {defaultAddress ? (
                                                                <div className="space-y-3">
                                                                    <div className="flex items-start gap-3">
                                                                        <div className="p-2 rounded-xl bg-gradient-to-r from-cyan-500/10 to-indigo-500/10">
                                                                            <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                                            </svg>
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-white font-medium">{defaultAddress.fullName}</p>
                                                                            <p className="text-gray-400 text-sm">{defaultAddress.phone}</p>
                                                                        </div>
                                                                    </div>

                                                                    <div className="flex items-start gap-3">
                                                                        <div className="p-2 rounded-xl bg-gradient-to-r from-cyan-500/10 to-indigo-500/10">
                                                                            <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                                                            </svg>
                                                                        </div>
                                                                        <div className="space-y-1">
                                                                            <p className="text-gray-300">{defaultAddress.streetAddress}</p>
                                                                            <p className="text-gray-400 text-sm">
                                                                                {defaultAddress.district}, {defaultAddress.city}
                                                                            </p>
                                                                            <p className="text-gray-400 text-sm">
                                                                                {defaultAddress.province}, {defaultAddress.postalCode}
                                                                            </p>
                                                                            {defaultAddress.details && (
                                                                                <p className="text-gray-400 text-sm italic">
                                                                                    Note: {defaultAddress.details}
                                                                                </p>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="flex flex-col items-center justify-center py-6 text-center space-y-3">
                                                                    <div className="p-3 rounded-full bg-gradient-to-r from-cyan-500/10 to-indigo-500/10">
                                                                        <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                        </svg>
                                                                    </div>
                                                                    <div className="space-y-1">
                                                                        <p className="text-gray-300 font-medium">No delivery address found</p>
                                                                        <p className="text-gray-400 text-sm">Please add a delivery address in your profile</p>
                                                                    </div>
                                                                    <Link
                                                                        href="/account/address"
                                                                        className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-xl text-white text-sm font-medium hover:from-cyan-600 hover:to-indigo-600 transition-all duration-300"
                                                                    >
                                                                        Add Address
                                                                    </Link>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* Payment Button */}
                                                    <button
                                                        onClick={handleTransaction}
                                                        disabled={isProcessing || !deliveryMethod}
                                                        className={`relative w-full overflow-hidden rounded-2xl transition-all duration-300
                                                            ${isProcessing || !deliveryMethod
                                                                ? 'bg-gray-800/40 cursor-not-allowed'
                                                                : 'bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-600 hover:to-indigo-600'
                                                            }`}
                                                    >
                                                        <div className="relative z-10 px-6 py-4 flex items-center justify-center gap-3">
                                                            {isProcessing ? (
                                                                <>
                                                                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                                                    <span className="text-white font-medium">Processing...</span>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                                            d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                                                    </svg>
                                                                    <span className="text-white font-medium">
                                                                        {deliveryMethod ? 'Proceed to Payment' : 'Select Delivery Method'}
                                                                    </span>
                                                                </>
                                                            )}
                                                        </div>
                                                        <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent 
                                                            opacity-0 hover:opacity-20 transition-opacity duration-300" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {/* View Details Button */}
                                        <div className='flex gap-4'>
                                            {/* Action Buttons */}
                                            <div className="grid grid-cols-2 gap-4 w-full">
                                                {/* Live Preview Button */}
                                                <button
                                                    onClick={() => window.open(selectedPreview.linkPreview, '_blank')}
                                                    className="group relative flex items-center p-4 w-full
                                                            bg-gradient-to-br from-indigo-500/10 to-cyan-500/10
                                                            hover:from-indigo-500/20 hover:to-cyan-500/20
                                                            border border-indigo-500/20 hover:border-indigo-500/40
                                                            rounded-xl transition-all duration-300"
                                                >
                                                    {/* Icon */}
                                                    <div className="absolute left-4 p-2 rounded-lg 
                                                        bg-gradient-to-r from-indigo-500 to-cyan-500
                                                        group-hover:scale-110 transition-transform duration-300">
                                                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                        </svg>
                                                    </div>

                                                    {/* Text Content */}
                                                    <div className="flex flex-col ml-11 text-left">
                                                        <span className="text-sm font-medium text-white">Live Preview</span>
                                                        <span className="text-xs text-gray-400">View live demo</span>
                                                    </div>

                                                    {/* Arrow Icon */}
                                                    <svg className="absolute right-4 w-4 h-4 text-gray-400 
                                                        group-hover:translate-x-1 transition-transform duration-300"
                                                        fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                            d="M9 5l7 7-7 7" />
                                                    </svg>
                                                </button>

                                                {/* Project Details Button */}
                                                <button
                                                    onClick={() => router.push(`/project/${formatSlug(selectedPreview.typeCategory)}/${formatSlug(selectedPreview.typeTitle)}/${selectedPreview.slug}`)}
                                                    className="group relative flex items-center p-4 w-full
                                                        bg-gradient-to-br from-indigo-500/10 to-cyan-500/10
                                                        hover:from-indigo-500/20 hover:to-cyan-500/20
                                                        border border-indigo-500/20 hover:border-indigo-500/40
                                                        rounded-xl transition-all duration-300"
                                                >
                                                    {/* Icon */}
                                                    <div className="absolute left-4 p-2 rounded-lg 
                                                        bg-gradient-to-r from-indigo-500 to-cyan-500
                                                        group-hover:scale-110 transition-transform duration-300">
                                                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                    </div>

                                                    {/* Text Content */}
                                                    <div className="flex flex-col ml-11 text-left">
                                                        <span className="text-sm font-medium text-white">Project Details</span>
                                                        <span className="text-xs text-gray-400">View full information</span>
                                                    </div>

                                                    {/* Arrow Icon */}
                                                    <svg className="absolute right-4 w-4 h-4 text-gray-400 
                                                        group-hover:translate-x-1 transition-transform duration-300"
                                                        fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                            d="M9 5l7 7-7 7" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </Fragment>
    )
}