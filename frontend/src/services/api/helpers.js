export const extractData = (response) =>
  response?.data && Object.prototype.hasOwnProperty.call(response.data, 'data')
    ? response.data.data
    : response?.data;

export const handleRequest = async (promise) => {
  try {
    const response = await promise;
    return extractData(response);
  } catch (error) {
    throw error?.response?.data || error;
  }
};
