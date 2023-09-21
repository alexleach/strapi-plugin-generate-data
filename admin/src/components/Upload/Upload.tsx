import React from 'react';
import { Button } from '@strapi/design-system';
import axios from '../../utils/axiosInstance';
import { AttributeType } from '../../pages/HomePage/types';

const COUNT_UPLOADED_DATA_ONCE = 25;

interface Props {
	isUploadingData: boolean;
	attributes: any;
	selectedType: any;
	isFlushedPreviousData: boolean;
	isPublished: boolean;
	checkedAttributes: string[];
	generatedData: { [key: string]: any }[];
	onChangeIsUploadingData: (value: boolean) => void;
	onChangeShowAlert: (value: boolean) => void;
	onChangeUploadedError: (value: boolean) => void;
}

const Upload = ({
	isUploadingData,
	attributes,
	isFlushedPreviousData,
	selectedType,
	isPublished,
	checkedAttributes,
	generatedData,
	onChangeIsUploadingData,
	onChangeShowAlert,
	onChangeUploadedError
}: Props) => {
	const handleUploadData = async () => {
		onChangeIsUploadingData(true);
		onChangeShowAlert(false);
		onChangeUploadedError(false);
		const mediaKeys = Object.keys(attributes).filter(
			(key) => attributes[key].type === AttributeType.Media && checkedAttributes.includes(key)
		);

		if (selectedType) {
			try {
				if (isFlushedPreviousData) {
					await axios.post(`/generate-data/flush/${selectedType.uid}`);
				}
				let uploadData = async (data) => {
					if (!data.length) {
						return;
					}
					let dataByCount = data.slice(0, COUNT_UPLOADED_DATA_ONCE);
					let uploadedMediaData = {};

					if (mediaKeys.length) {
						const mediaData = mediaKeys.reduce((prev, key) => {
							return {
								...prev,
								[key]: dataByCount.map((item) => item[key])
							};
						}, {});
						try {
							const response = await axios.post('/generate-data/upload', mediaData);
							uploadedMediaData = response.data;
						} catch (err) {
							onChangeUploadedError(true);
						}
					}

					const transformedData = Object.keys(uploadedMediaData).length
						? dataByCount.map((item, index) => {
								let newItem = {};
								Object.keys(uploadedMediaData).forEach((key) => {
									newItem[key] =
										uploadedMediaData[key][index].map((uploadedItem) => uploadedItem.id) ||
										item[key];
								});
								return { ...item, ...newItem };
						  })
						: dataByCount;

					await axios.post(
						`/generate-data/create/${selectedType.uid}`,
						isPublished
							? transformedData.map((item) => ({ ...item, publishedAt: new Date() }))
							: transformedData
					);

					return uploadData(data.slice(COUNT_UPLOADED_DATA_ONCE));
				};
				await uploadData(generatedData);
			} catch (err) {
				onChangeUploadedError(true);
			}
		}
		onChangeIsUploadingData(false);
		onChangeShowAlert(true);
	};
	return (
		<Button variant='secondary' loading={isUploadingData} onClick={handleUploadData}>
			Upload data
		</Button>
	);
};

export default Upload;
