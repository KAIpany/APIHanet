import React, { useState, useEffect, useCallback } from "react";
import "./App.css"; // Sẽ tạo file CSS riêng

const App = () => {
  const [formData, setFormData] = useState({
    placeId: "",
    deviceId: "",
    fromDateTime: "",
    toDateTime: "",
  });
  const [places, setPlaces] = useState([]);
  const [devices, setDevices] = useState([]);
  const [isPlacesLoading, setIsPlacesLoading] = useState(false);
  const [isDevicesLoading, setIsDevicesLoading] = useState(false);
  const [placeError, setPlaceError] = useState(null);
  const [deviceError, setDeviceError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [resultsData, setResultsData] = useState(null);
  const [queryString, setQueryString] = useState(null);
  const hanetServiceId = require('../../api/hanetServiceId.js');
  const fetchPlaces = useCallback(async () => {
    setIsPlacesLoading(true);
    setPlaceError(null);
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/place`
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Lỗi ${response.status}: ${
            errorData.message || "Không thể lấy danh sách địa điểm."
          }`
        );
      }
      const result = await response.json();
      if (result.success && Array.isArray(result.data)) {
        setPlaces(result.data);
      } else {
        throw new Error("Dữ liệu địa điểm trả về không hợp lệ.");
      }
    } catch (err) {
      setPlaceError(err.message || "Lỗi khi tải địa điểm.");
      setPlaces([]);
    } finally {
      setIsPlacesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlaces();
  }, [fetchPlaces]);

  const fetchDevices = useCallback(async (selectedPlaceId) => {
    if (!selectedPlaceId) {
      setDevices([]);
      setDeviceError(null);
      return;
    }
    setIsDevicesLoading(true);
    setDeviceError(null);
    setDevices([]);
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/device?placeId=${selectedPlaceId}`
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Lỗi ${response.status}: ${
            errorData.message || "Không thể lấy danh sách thiết bị."
          }`
        );
      }
      const result = await response.json();
      if (result.success && Array.isArray(result.data)) {
        setDevices(result.data);
      } else {
        throw new Error("Dữ liệu thiết bị trả về không hợp lệ.");
      }
    } catch (err) {
      setDeviceError(err.message || "Lỗi khi tải thiết bị.");
      setDevices([]);
    } finally {
      setIsDevicesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDevices(formData.placeId);
  }, [formData.placeId, fetchDevices]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
    setSubmitError(null);
    setSuccessMessage(null);
    setResultsData(null);
  };

  const handlePlaceChange = (event) => {
    const { value } = event.target;
    setFormData((prevState) => ({
      ...prevState,
      placeId: value,
      deviceId: "",
    }));
    setSubmitError(null);
    setSuccessMessage(null);
    setDeviceError(null);
    setDevices([]);
    setResultsData(null);
  };

  const getPlaceName = useCallback(
    (id) => {
      if (!id) return "Chưa chọn";
      return places.find((p) => p.id.toString() === id)?.name || `ID: ${id}`;
    },
    [places]
  );

  const getDeviceName = useCallback(
    (id) => {
      if (!id) return "Chưa chọn / Tất cả";
      return devices.find((d) => d.deviceID === id)?.deviceName || `ID: ${id}`;
    },
    [devices]
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);
    setSuccessMessage(null);
    setResultsData(null);

    try {
      if (
        formData.fromDateTime &&
        formData.toDateTime &&
        new Date(formData.fromDateTime) > new Date(formData.toDateTime)
      ) {
        throw new Error(
          "Thời gian bắt đầu không được lớn hơn thời gian kết thúc."
        );
      }
    } catch (e) {
      setSubmitError(e.message || "Định dạng ngày giờ không hợp lệ.");
      setIsSubmitting(false);
      return;
    }

    try {
      const result = await hanetServiceId.getPeopleListByMethod(formData.placeId, new Date(formData.fromDateTime).getTime().toString(), new Date(formData.toDateTime).getTime().toString(), formData.deviceId);
      console.log(result);

      if (Array.isArray(result)) {
        setResultsData(result);
        console.log("asdasd", resultsData);

        setSuccessMessage(`Tìm thấy ${result.length} kết quả.`);
      } else {
        setResultsData([]);
        setSuccessMessage(result.message || "Không tìm thấy kết quả nào.");
      }
    } catch (err) {
      console.error("Lỗi khi lấy dữ liệu:", err);
      setSubmitError(err.message || "Đã xảy ra lỗi khi truy vấn.");
      setResultsData(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="container">
      {/* --- Form --- */}
      <form onSubmit={handleSubmit} className="query-form">
        <h2 className="form-title">Truy vấn Dữ liệu Check-in</h2>

        {/* --- Dropdown PlaceId --- */}
        <div className="form-group">
          <label htmlFor="placeId" className="form-label required">
            Địa điểm:
          </label>
          <select
            id="placeId"
            name="placeId"
            value={formData.placeId}
            onChange={handlePlaceChange}
            className={isPlacesLoading ? "select-loading" : ""}
            required
            disabled={isPlacesLoading}
          >
            <option value="">
              {isPlacesLoading ? "Đang tải địa điểm..." : "-- Chọn địa điểm --"}
            </option>
            {places.map((place) => (
              <option key={place.id} value={place.id}>
                {place.name} (ID: {place.id})
              </option>
            ))}
          </select>
          {placeError && <p className="error-message">{placeError}</p>}
        </div>

        {/* --- Dropdown DeviceId --- */}
        <div className="form-group">
          <label
            htmlFor="deviceId"
            className={
              !formData.placeId || isDevicesLoading
                ? "form-label disabled"
                : "form-label"
            }
          >
            Thiết bị (Tùy chọn):
          </label>
          <select
            id="deviceId"
            name="deviceId"
            value={formData.deviceId}
            onChange={handleChange}
            className={
              !formData.placeId || isDevicesLoading ? "select-disabled" : ""
            }
            disabled={!formData.placeId || isDevicesLoading}
          >
            <option value="">
              {!formData.placeId
                ? "-- Chọn địa điểm trước --"
                : isDevicesLoading
                ? "Đang tải thiết bị..."
                : devices.length === 0
                ? "-- Không có thiết bị --"
                : "-- Chọn thiết bị (để lọc) --"}
            </option>
            {/* Chỉ render options khi có devices */}
            {devices.map((device) => (
              <option key={device.deviceID} value={device.deviceID}>
                {device.deviceName} (ID: {device.deviceID})
              </option>
            ))}
          </select>
          {deviceError && <p className="error-message">{deviceError}</p>}
        </div>

        {/* --- Khu vực chọn thời gian --- */}
        <div className="time-range-container">
          <p className="section-title">Khoảng thời gian</p>
          <div className="time-range-grid">
            {/* Input From */}
            <div className="form-group">
              <label htmlFor="fromDateTime" className="form-label required">
                Từ:
              </label>
              <input
                type="datetime-local"
                id="fromDateTime"
                name="fromDateTime"
                value={formData.fromDateTime}
                onChange={handleChange}
              />
            </div>
            {/* Input To */}
            <div className="form-group">
              <label htmlFor="toDateTime" className="form-label required">
                Đến:
              </label>
              <input
                type="datetime-local"
                id="toDateTime"
                name="toDateTime"
                value={formData.toDateTime}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        {/* --- Input Tóm tắt --- */}
        <div className="form-group">
          <label htmlFor="summaryInput" className="form-label-sm">
            Thông tin truy vấn:
          </label>
          <input
            type="text"
            id="summaryInput"
            readOnly
            value={`${process.env.REACT_APP_API_URL}/api/checkins?${queryString}`}
            className="summary-input"
          />
        </div>

        {/* --- Thông báo Lỗi/Thành công Submit --- */}
        {submitError && (
          <div className="alert-error" role="alert">
            <span className="alert-label">Lỗi: </span>
            {submitError}
          </div>
        )}
        {successMessage && resultsData === null && (
          <div className="alert-info" role="status">
            <span>{successMessage}</span>
          </div>
        )}

        {/* --- Nút Submit --- */}
        <button
          type="submit"
          className={
            isSubmitting || isPlacesLoading
              ? "submit-btn disabled"
              : "submit-btn"
          }
          disabled={isSubmitting || isPlacesLoading}
        >
          {isSubmitting ? "Đang tìm kiếm..." : "Tìm kiếm Check-in"}
        </button>
      </form>

      {resultsData !== null && (
        <div className="results-container">
          <h3 className="results-title">
            Kết quả truy vấn ({resultsData.length})
          </h3>
          {resultsData.length > 0 ? (
            <div className="table-container">
              <table className="results-table">
                <thead>
                  <tr>
                    <th>Tên</th>
                    <th>PersonID</th>
                    <th>PlaceId</th>
                    <th>AliasID</th>
                    <th>Chức vụ</th>
                    <th>Thời gian Checkin</th>
                    <th>Thời gian Checkout</th>
                  </tr>
                </thead>
                <tbody>
                  {resultsData.map((result, index) => (
                    <tr key={result.personID + "_" + index}>
                      <td>{result.personName || "(Không tên)"}</td>
                      <td className="monospace">{result.personID}</td>
                      <td>{result.placeID || "(Không tên)"}</td>
                      <td>{result.aliasID || "N/A"}</td>
                      <td>{result.title || "N/A"}</td>
                      <td>
                        {result.timestamp
                          ? new Date(result.timestamp).toLocaleString("vi-VN")
                          : "N/A"}
                      </td>
                      <td>
                        {result.outtimestamp
                          ? new Date(result.outtimestamp).toLocaleString("vi-VN")
                          : "N/A"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="no-results">{successMessage}</p>
          )}
          {/* Textarea hiển thị JSON thô */}
          <div className="json-container">
            <h4 className="json-title">Dữ liệu API trả về (JSON thô)</h4>
            <textarea
              readOnly
              rows={15}
              className="json-display"
              value={JSON.stringify(resultsData, null, 2)}
            />
          </div>
        </div>
      )}
    </main>
  );
};

export default App;
