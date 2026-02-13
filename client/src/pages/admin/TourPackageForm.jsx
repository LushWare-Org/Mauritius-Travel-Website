import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage, FieldArray } from 'formik';
import * as Yup from 'yup';
import AdminLayout from '../../components/admin/AdminLayout';
import API from '../../utils/api';

// Create a direct Cloudinary upload function for this component
const uploadToCloudinary = async (file) => {
  const uploadPreset = process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET;
  const cloudName = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME;
  
  if (!uploadPreset || !cloudName) {
    throw new Error('Cloudinary configuration is missing. Please check your .env file.');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);
  formData.append('cloud_name', cloudName);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: 'POST',
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error('Failed to upload to Cloudinary');
  }

  const data = await response.json();
  return data.secure_url;
};

// Create a backend upload function
const uploadToBackend = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await API.post('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  if (response.data.success) {
    return response.data.data?.url || response.data.url;
  }
  throw new Error('Backend upload failed');
};

const TourPackageForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [packageData, setPackageData] = useState(null);
  const [loading, setLoading] = useState(id ? true : false);
  const [images, setImages] = useState([]);
  const [galleryImages, setGalleryImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const isNew = !id;

  useEffect(() => {
    if (id) {
      const fetchPackage = async () => {
        try {
          setLoading(true);
          const response = await API.get(`/tour-packages/${id}`);
          
          if (response.data.success) {
            const data = response.data.data;
            setPackageData(data);

            // Set main image
            if (data.image) {
              setImages([{ 
                id: Date.now(), 
                url: data.image, 
                isUploaded: true,
                originalUrl: data.image 
              }]);
            }

            // Set gallery images
            if (data.galleryImages && data.galleryImages.length > 0) {
              setGalleryImages(data.galleryImages.map((url, index) => ({
                id: Date.now() + index,
                url,
                isUploaded: true,
                originalUrl: url
              })));
            }

            setLoading(false);
          } else {
            setError('Failed to load tour package data');
            setLoading(false);
          }
        } catch (err) {
          console.error('Error fetching package:', err);
          setError('Failed to load tour package data');
          setLoading(false);
        }
      };

      fetchPackage();
    }
  }, [id]);

  const validationSchema = Yup.object({
    title: Yup.string().required('Title is required'),
    shortDescription: Yup.string().max(200, 'Short description max 200 chars'),
    description: Yup.string().required('Description is required'),
    priceRs: Yup.number()
      .required('Price in RS is required')
      .positive('Must be positive')
      .min(0, 'Cannot be negative'),
    priceEur: Yup.number()  // CHANGED: priceEuro → priceEur
      .required('Price in Euros is required')
      .positive('Must be positive')
      .min(0, 'Cannot be negative'),
    currencyType: Yup.string()
      .oneOf(['both', 'rs-only', 'eur-only']) // CHANGED: euro-only → eur-only
      .required('Currency display type is required'),
    itinerary: Yup.array().of(Yup.string()),
    included: Yup.array().of(Yup.string()),
    notIncluded: Yup.array().of(Yup.string()),
    featured: Yup.boolean(),
    status: Yup.string().oneOf(['active', 'inactive'])
  });

  const handleImageUpload = async (event, isGallery = false) => {
    const files = Array.from(event.target.files);
    if (!files.length) return;
    
    setUploading(true);
    const uploadPromises = [];

    for (const file of files) {
      try {
        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          alert(`File ${file.name} exceeds 5MB limit`);
          continue;
        }

        // Create a preview URL immediately
        const previewUrl = URL.createObjectURL(file);
        const tempImage = {
          id: Date.now() + Math.random(),
          url: previewUrl,
          isUploaded: false,
          file: file,
          isUploading: true
        };

        // Add to state immediately for preview
        if (isGallery) {
          setGalleryImages(prev => [...prev, tempImage]);
        } else {
          setImages([tempImage]);
        }

        // Start upload in background
        const uploadPromise = (async () => {
          try {
            // Try Cloudinary first
            let uploadedUrl;
            try {
              uploadedUrl = await uploadToCloudinary(file);
            } catch (cloudinaryError) {
              console.log('Cloudinary failed, trying backend...', cloudinaryError);
              // Fallback to backend
              uploadedUrl = await uploadToBackend(file);
            }

            // Update the image in state with the uploaded URL
            const updatedImage = {
              ...tempImage,
              url: uploadedUrl,
              isUploaded: true,
              isUploading: false
            };

            if (isGallery) {
              setGalleryImages(prev => 
                prev.map(img => 
                  img.id === tempImage.id ? updatedImage : img
                )
              );
            } else {
              setImages([updatedImage]);
            }

            // Revoke the preview URL
            URL.revokeObjectURL(previewUrl);
            return updatedImage;
          } catch (uploadError) {
            console.error('Upload failed:', uploadError);
            
            // Update state to show upload failure
            if (isGallery) {
              setGalleryImages(prev => 
                prev.map(img => 
                  img.id === tempImage.id 
                    ? { ...img, isUploading: false, uploadError: true }
                    : img
                )
              );
            } else {
              setImages(prev => 
                prev.map(img => 
                  img.id === tempImage.id 
                    ? { ...img, isUploading: false, uploadError: true }
                    : img
                )
              );
            }
            
            alert(`Failed to upload ${file.name}. Please try again.`);
            return null;
          }
        })();

        uploadPromises.push(uploadPromise);
      } catch (err) {
        console.error('Error processing file:', err);
        alert(`Error processing ${file.name}`);
      }
    }

    // Wait for all uploads to complete
    Promise.allSettled(uploadPromises).then(() => {
      setUploading(false);
    });
  };

  const removeImage = (id, isGallery = false) => {
    if (isGallery) {
      setGalleryImages(prev => prev.filter(img => img.id !== id));
    } else {
      setImages(prev => prev.filter(img => img.id !== id));
    }
  };

  const handleSubmit = async (values, { setSubmitting }) => {
    console.log('Submitting form...');

    // Check if images are still uploading
    const allImages = [...images, ...galleryImages];
    const uploadingImages = allImages.filter(img => img.isUploading);
    const failedImages = allImages.filter(img => img.uploadError);

    if (uploadingImages.length > 0) {
      alert('Please wait for all images to finish uploading.');
      setSubmitting(false);
      return;
    }

    if (failedImages.length > 0) {
      alert('Some images failed to upload. Please fix or remove them before saving.');
      setSubmitting(false);
      return;
    }

    if (!images.length) {
      alert('Please upload a main image.');
      setSubmitting(false);
      return;
    }

    // Filter out images that weren't uploaded
    const validGalleryImages = galleryImages
      .filter(img => img.isUploaded && !img.uploadError)
      .map(img => img.url);

    // Prepare price object based on currency type
    let priceObject = {};
    
    // Use the correct field names for backend
    switch(values.currencyType) {
      case 'both':
        priceObject = {
          price: values.priceRs, // Main price field
          priceEur: values.priceEur, //  priceEuro → priceEur
          supportsCurrency: 'both' // currencyType → supportsCurrency
        };
        break;
      case 'rs-only':
        priceObject = {
          price: values.priceRs,
          priceEur: null,
          supportsCurrency: 'rs-only'
        };
        break;
      case 'eur-only':
        priceObject = {
          price: values.priceEur, // For euro-only, set price to EUR value
          priceEur: values.priceEur,
          supportsCurrency: 'eur-only'
        };
        break;
      default:
        priceObject = {
          price: values.priceRs,
          priceEur: values.priceEur,
          supportsCurrency: 'both'
        };
    }

    const payload = {
      title: values.title,
      shortDescription: values.shortDescription || '',
      description: values.description,
      ...priceObject,
      image: images[0]?.url || '',
      galleryImages: validGalleryImages,
      included: Array.isArray(values.included) ? values.included : [],
      notIncluded: Array.isArray(values.notIncluded) ? values.notIncluded : ['Entrance fees'],
      itinerary: Array.isArray(values.itinerary) ? values.itinerary : [],
      featured: values.featured || false,
      status: values.status || 'active'
    };

    console.log('Submitting payload:', payload);

    try {
      let response;
      if (isNew) {
        response = await API.post('/tour-packages', payload);
      } else {
        response = await API.put(`/tour-packages/${id}`, payload);
      }

      if (response.data.success) {
        alert(isNew ? 'Tour package created successfully!' : 'Tour package updated successfully!');
        navigate('/admin/tour-packages');
      } else {
        throw new Error(response.data.message || 'Failed to save package');
      }
    } catch (err) {
      console.error('Error saving package:', err);
      alert(err.message || 'Error saving tour package. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (error) return (
    <AdminLayout>
      <div className="bg-red-50 p-4 mb-6 text-red-700 rounded-lg">
        <p className="font-medium">Error: {error}</p>
        <button 
          onClick={() => navigate('/admin/tour-packages')} 
          className="mt-3 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
        >
          Back to Tour Packages
        </button>
      </div>
    </AdminLayout>
  );

  return (
    <AdminLayout>
      <div className="pb-5 border-b mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {isNew ? 'Add Tour Package' : 'Edit Tour Package'}
          </h1>
          <p className="text-gray-600 mt-1">
            {isNew ? 'Create a new tour package' : `Editing: ${packageData?.title || 'Tour Package'}`}
          </p>
        </div>
        <button 
          onClick={() => navigate('/admin/tour-packages')} 
          className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition"
        >
          Cancel
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin h-10 w-10 border-4 border-blue-500 rounded-full border-t-transparent"></div>
          <p className="ml-3 text-gray-600">Loading package data...</p>
        </div>
      ) : (
        <Formik
          initialValues={{
            title: packageData?.title || '',
            shortDescription: packageData?.shortDescription || '',
            description: packageData?.description || '',
            priceRs: packageData?.price || packageData?.priceRs || '',
            priceEur: packageData?.priceEur || '', //  priceEuro → priceEur
            currencyType: packageData?.supportsCurrency || 'both', //  currencyType → supportsCurrency
            itinerary: packageData?.itinerary || [],
            included: packageData?.included || [],
            notIncluded: packageData?.notIncluded || ['Entrance fees'],
            featured: packageData?.featured || false,
            status: packageData?.status || 'active'
          }}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
          enableReinitialize={true}
        >
          {({ values, setFieldValue, isSubmitting }) => (
            <Form className="space-y-8">
              {/* Basic Info Section */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-6 pb-3 border-b">
                  Basic Information
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      Title <span className="text-red-500">*</span>
                    </label>
                    <Field 
                      name="title" 
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                      placeholder="Enter tour package title"
                    />
                    <ErrorMessage name="title" component="div" className="text-red-600 text-sm mt-1" />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-gray-700 font-medium mb-3">
                      Price Display Options <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-blue-50 transition-colors">
                        <Field 
                          type="radio" 
                          name="currencyType" 
                          value="both" 
                          className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                        />
                        <div className="ml-3">
                          <span className="font-medium text-gray-700">Show Both</span>
                          <p className="text-sm text-gray-500 mt-1">Display price in Rs and Euros</p>
                        </div>
                      </label>
                      
                      <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-blue-50 transition-colors">
                        <Field 
                          type="radio" 
                          name="currencyType" 
                          value="rs-only" 
                          className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                        />
                        <div className="ml-3">
                          <span className="font-medium text-gray-700">Rs Only</span>
                          <p className="text-sm text-gray-500 mt-1">Display only Mauritius Rupees</p>
                        </div>
                      </label>
                      
                      <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-blue-50 transition-colors">
                        <Field 
                          type="radio" 
                          name="currencyType" 
                          value="eur-only" 
                          className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                        />
                        <div className="ml-3">
                          <span className="font-medium text-gray-700">Euro Only</span>
                          <p className="text-sm text-gray-500 mt-1">Display only Euros</p>
                        </div>
                      </label>
                    </div>
                    <ErrorMessage name="currencyType" component="div" className="text-red-600 text-sm mt-1" />
                  </div>

                  {(values.currencyType === 'both' || values.currencyType === 'rs-only') && (
                    <div>
                      <label className="block text-gray-700 font-medium mb-2">
                        Price (MUR) <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">Rs</span>
                        <Field 
                          type="number" 
                          name="priceRs" 
                          className="w-full pl-12 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                          placeholder="Enter price in Mauritius Rupees"
                          min="0"
                          step="1"
                        />
                      </div>
                      <ErrorMessage name="priceRs" component="div" className="text-red-600 text-sm mt-1" />
                    </div>
                  )}

                  {(values.currencyType === 'both' || values.currencyType === 'eur-only') && (
                    <div>
                      <label className="block text-gray-700 font-medium mb-2">
                        Price (EUR) <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">€</span>
                        <Field 
                          type="number" 
                          name="priceEur"  //  priceEuro → priceEur
                          className="w-full pl-12 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                          placeholder="Enter price in Euros"
                          min="0"
                          step="0.01"
                        />
                      </div>
                      <ErrorMessage name="priceEur" component="div" className="text-red-600 text-sm mt-1" />
                    </div>
                  )}

                  <div className="md:col-span-2">
                    <label className="block text-gray-700 font-medium mb-2">
                      Short Description
                    </label>
                    <Field 
                      as="textarea" 
                      name="shortDescription" 
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                      rows={2}
                      placeholder="Brief description (max 200 characters)"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {200 - (values.shortDescription?.length || 0)} characters remaining
                    </p>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-gray-700 font-medium mb-2">
                      Full Description <span className="text-red-500">*</span>
                    </label>
                    <Field 
                      as="textarea" 
                      name="description" 
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                      rows={6}
                      placeholder="Detailed description of the tour package"
                    />
                    <ErrorMessage name="description" component="div" className="text-red-600 text-sm mt-1" />
                  </div>
                </div>
              </div>

              {/* Status & Featured */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-6 pb-3 border-b">
                  Settings
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-gray-700 font-medium mb-3">Status</label>
                    <div className="flex space-x-6">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <Field 
                          type="radio" 
                          name="status" 
                          value="active" 
                          className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-gray-700">Active</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <Field 
                          type="radio" 
                          name="status" 
                          value="inactive" 
                          className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-gray-700">Inactive</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <Field 
                        type="checkbox" 
                        name="featured" 
                        className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-gray-700 font-medium">Featured Package</span>
                        <p className="text-sm text-gray-500 mt-1">Show this package as featured on the homepage</p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Images Section */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-6 pb-3 border-b">
                  Images
                </h2>

                {/* Main Image */}
                <div className="mb-8">
                  <h3 className="font-medium text-gray-800 mb-3">
                    Main Image <span className="text-red-500">*</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {images.map(img => (
                      <div key={img.id} className="relative group">
                        <img 
                          src={img.url} 
                          alt="Main" 
                          className="h-48 w-full object-cover rounded-lg shadow-md"
                        />
                        {img.isUploading && (
                          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                            <div className="text-white text-center">
                              <div className="animate-spin h-8 w-8 border-2 border-white border-t-transparent rounded-full mx-auto mb-2"></div>
                              <p className="text-xs">Uploading...</p>
                            </div>
                          </div>
                        )}
                        {img.uploadError && (
                          <div className="absolute inset-0 bg-red-500 bg-opacity-90 flex items-center justify-center rounded-lg">
                            <div className="text-white text-center p-2">
                              <i className="fas fa-exclamation-triangle text-lg mb-1"></i>
                              <p className="text-xs">Upload Failed</p>
                            </div>
                          </div>
                        )}
                        <button 
                          type="button" 
                          onClick={() => removeImage(img.id)} 
                          className="absolute top-2 right-2 text-white bg-red-500 hover:bg-red-600 rounded-full p-1.5 text-sm opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Remove image"
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </div>
                    ))}
                    
                    <label className="h-48 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
                      <input 
                        type="file" 
                        className="hidden" 
                        accept="image/*"
                        onChange={e => handleImageUpload(e, false)} 
                        disabled={uploading}
                      />
                      <div className="text-blue-500 mb-2">
                        <i className="fas fa-cloud-upload-alt text-2xl"></i>
                      </div>
                      <span className="text-sm text-gray-600 font-medium">
                        {uploading ? 'Uploading...' : 'Upload Main Image'}
                      </span>
                      <p className="text-xs text-gray-500 mt-1 text-center px-4">
                        Click to upload main image
                      </p>
                    </label>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    This will be the primary image displayed for the tour package
                  </p>
                </div>

                {/* Gallery Images */}
                <div>
                  <h3 className="font-medium text-gray-800 mb-3">Gallery Images</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {galleryImages.map(img => (
                      <div key={img.id} className="relative group">
                        <img 
                          src={img.url} 
                          alt="Gallery" 
                          className="h-48 w-full object-cover rounded-lg shadow-md"
                        />
                        {img.isUploading && (
                          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                            <div className="text-white text-center">
                              <div className="animate-spin h-8 w-8 border-2 border-white border-t-transparent rounded-full mx-auto mb-2"></div>
                              <p className="text-xs">Uploading...</p>
                            </div>
                          </div>
                        )}
                        {img.uploadError && (
                          <div className="absolute inset-0 bg-red-500 bg-opacity-90 flex items-center justify-center rounded-lg">
                            <div className="text-white text-center p-2">
                              <i className="fas fa-exclamation-triangle text-lg mb-1"></i>
                              <p className="text-xs">Upload Failed</p>
                            </div>
                          </div>
                        )}
                        <button 
                          type="button" 
                          onClick={() => removeImage(img.id, true)} 
                          className="absolute top-2 right-2 text-white bg-red-500 hover:bg-red-600 rounded-full p-1.5 text-sm opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Remove image"
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </div>
                    ))}
                    
                    <label className="h-48 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
                      <input 
                        type="file" 
                        multiple 
                        className="hidden" 
                        accept="image/*"
                        onChange={e => handleImageUpload(e, true)} 
                        disabled={uploading}
                      />
                      <div className="text-blue-500 mb-2">
                        <i className="fas fa-cloud-upload-alt text-2xl"></i>
                      </div>
                      <span className="text-sm text-gray-600 font-medium">
                        {uploading ? 'Uploading...' : 'Upload Gallery Images'}
                      </span>
                      <p className="text-xs text-gray-500 mt-1 text-center px-4">
                        Click to upload multiple images
                      </p>
                    </label>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Add multiple images to create a gallery for the tour package
                  </p>
                </div>
              </div>

              {/* Itinerary and Details Section */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-6 pb-3 border-b">
                  Package Details
                </h2>

                <div className="space-y-8">
                  {/* Itinerary */}
                  <div>
                    <h3 className="font-medium text-gray-800 mb-3">Itinerary</h3>
                    <FieldArray name="itinerary">
                      {({ push, remove }) => (
                        <div className="space-y-3">
                          {values.itinerary.map((item, index) => (
                            <div key={index} className="flex items-start space-x-3">
                              <span className="flex-shrink-0 mt-3 text-sm font-medium text-gray-700">
                                Trip {index + 1}:
                              </span>
                              <div className="flex-1">
                                <Field 
                                  name={`itinerary.${index}`} 
                                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                  placeholder={`Describe activities for Trip ${index + 1}`}
                                />
                              </div>
                              <button 
                                type="button" 
                                onClick={() => remove(index)} 
                                className="flex-shrink-0 mt-2.5 text-red-500 hover:text-red-700 transition"
                                title="Remove day"
                              >
                                <i className="fas fa-trash-alt"></i>
                              </button>
                            </div>
                          ))}
                          <button 
                            type="button" 
                            onClick={() => push('')} 
                            className="px-4 py-2.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition font-medium"
                          >
                            <i className="fas fa-plus mr-2"></i>
                            Add Trip
                          </button>
                        </div>
                      )}
                    </FieldArray>
                  </div>

                  {/* Included / Not Included */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <h3 className="font-medium text-gray-800 mb-3">What's Included</h3>
                      <FieldArray name="included">
                        {({ push, remove }) => (
                          <div className="space-y-3">
                            {values.included.map((item, index) => (
                              <div key={index} className="flex items-center space-x-3">
                                <div className="flex-1">
                                  <Field 
                                    name={`included.${index}`} 
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                    placeholder="Add included item"
                                  />
                                </div>
                                <button 
                                  type="button" 
                                  onClick={() => remove(index)} 
                                  className="flex-shrink-0 text-red-500 hover:text-red-700 transition"
                                  title="Remove item"
                                >
                                  <i className="fas fa-trash-alt"></i>
                                </button>
                              </div>
                            ))}
                            <button 
                              type="button" 
                              onClick={() => push('')} 
                              className="px-4 py-2.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition font-medium"
                            >
                              <i className="fas fa-plus mr-2"></i>
                              Add Included Item
                            </button>
                          </div>
                        )}
                      </FieldArray>
                    </div>

                    <div>
                      <h3 className="font-medium text-gray-800 mb-3">Not Included</h3>
                      <FieldArray name="notIncluded">
                        {({ push, remove }) => (
                          <div className="space-y-3">
                            {values.notIncluded.map((item, index) => (
                              <div key={index} className="flex items-center space-x-3">
                                <div className="flex-1">
                                  <Field 
                                    name={`notIncluded.${index}`} 
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                    placeholder="Add excluded item"
                                  />
                                </div>
                                <button 
                                  type="button" 
                                  onClick={() => remove(index)} 
                                  className="flex-shrink-0 text-red-500 hover:text-red-700 transition"
                                  title="Remove item"
                                >
                                  <i className="fas fa-trash-alt"></i>
                                </button>
                              </div>
                            ))}
                            <button 
                              type="button" 
                              onClick={() => push('')} 
                              className="px-4 py-2.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition font-medium"
                            >
                              <i className="fas fa-plus mr-2"></i>
                              Add Excluded Item
                            </button>
                          </div>
                        )}
                      </FieldArray>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-gray-600">
                      {isNew ? 'Ready to create a new tour package?' : 'Save your changes to update the tour package'}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      All fields marked with <span className="text-red-500">*</span> are required
                    </p>
                  </div>
                  <div className="flex space-x-4">
                    <button 
                      type="button" 
                      onClick={() => navigate('/admin/tour-packages')}
                      className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
                      disabled={isSubmitting}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      disabled={isSubmitting || uploading} 
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-save mr-2"></i>
                          {isNew ? 'Create Package' : 'Update Package'}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </Form>
          )}
        </Formik>
      )}
    </AdminLayout>
  );
};

export default TourPackageForm;