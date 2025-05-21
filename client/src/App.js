import React, { useState, useEffect, useCallback } from "react";
import "./App.css"; // Sẽ tạo file CSS riêng

// Hàm xử lý dữ liệu check-in
const processCheckinData = (data) => {
  const checkinsByPerson = {};

  data.forEach((checkin) => {
    const personKey = `${checkin.personID}`;
    
    if (!checkinsByPerson[personKey]) {
      // Nếu là lần đầu gặp người này
      checkinsByPerson[personKey] = {
        personName: checkin.personName,
        personID: checkin.personID,
        aliasID: checkin.aliasID || "",
        placeID: checkin.placeID,
        title: checkin.title || "N/A",
        timestamp: checkin.checkinTime, // Thời gian check-in đầu tiên
        checkoutTimestamp: checkin.checkinTime // Khởi tạo thời gian check-out
      };
    } else {
      // Cập nhật thời gian check-in sớm nhất
      if (checkin.checkinTime < checkinsByPerson[personKey].timestamp) {
        checkinsByPerson[personKey].timestamp = checkin.checkinTime;
      }
      // Cập nhật thời gian check-out muộn nhất
      if (checkin.checkinTime > checkinsByPerson[personKey].checkoutTimestamp) {
        checkinsByPerson[personKey].checkoutTimestamp = checkin.checkinTime;
      }
    }
  });

  return Object.values(checkinsByPerson);
};

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

  const fetchPlaces = useCallback(async () => {
    setIsPlacesLoading(true);
    setPlaceError(null);
    try {
      const response = await fetch(
        `https://api-hh5m.vercel.app/api/place`
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
        `https://api-hh5m.vercel.app/api/device?placeId=${selectedPlaceId}`
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

    let requestBody = {
      token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjE3OTQ4MzMyODE3MjcxNzAwMTUiLCJlbWFpbCI6InF1eW5oZG9uaHUyMUBnbWFpbC5jb20iLCJjbGllbnRfaWQiOiIxZGQxMzg3MjllZmE1YWU1MTc4MDQ4MzZmZGY1OThhMiIsInR5cGUiOiJhdXRob3JpemF0aW9uX2NvZGUiLCJpYXQiOjE3NDc3NDk5MDQsImV4cCI6MTc3OTI4NTkwNH0.7FhMn4wm_w_VnrWJD-eKeSmfR2yZ7qJ8rgOh0Ewy_gU"
    };

    // Thêm placeID và deviceID nếu có
    if (formData.placeId) requestBody.placeID = formData.placeId;
    if (formData.deviceId) requestBody.deviceID = formData.deviceId;

    try {
      // Xử lý thời gian
      if (formData.fromDateTime) {
        requestBody.from = new Date(formData.fromDateTime).getTime().toString();
      } else {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        requestBody.from = today.getTime().toString();
      }

      if (formData.toDateTime) {
        requestBody.to = new Date(formData.toDateTime).getTime().toString();
      } else {
        requestBody.to = new Date().getTime().toString();
      }

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

    setQueryString(JSON.stringify(requestBody, null, 2) || "");

    const apiUrl = "https://partner.hanet.ai/person/getCheckinByPlaceIdInTimestamp";
    console.log("Đang gọi API:", apiUrl, "với body:", requestBody);

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(requestBody).toString()
      });
      const result = await response.json();
      console.log(result);

      if (result.returnCode !== 1) {
        throw new Error(
          `Lỗi: ${result.returnMessage || "Không thể lấy dữ liệu"}`
        );
      }

      if (Array.isArray(result.data)) {
        // Xử lý dữ liệu để lấy check-in đầu và check-out cuối
        const processedData = processCheckinData(result.data);
        setResultsData(processedData);
        setSuccessMessage(`Tìm thấy ${processedData.length} kết quả.`);
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
          <textarea
            id="summaryInput"
            readOnly
            value={queryString}
            className="summary-input"
            rows={5}
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
                    <th>Thời gian Check-in</th>
                    <th>Thời gian Check-out</th>
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
                          ? new Date(parseInt(result.timestamp)).toLocaleString("vi-VN")
                          : "N/A"}
                      </td>
                      <td>
                        {result.checkoutTimestamp
                          ? new Date(parseInt(result.checkoutTimestamp)).toLocaleString("vi-VN")
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
