// src/components/AdminDashboard.jsx
import React, { useEffect, useState } from "react";

/**
 * AdminDashboard
 * - Fetches pending/approved students & drivers from backend
 * - Allows Approve / Reject / Delete actions
 * - Displays uploaded photo (ID card / profile) for both students and drivers
 *
 * NOTE:
 * - Backend base is BACKEND_URL (points to /api). Images are served from backend's /uploads static route.
 * - If your student/driver records store paths like "uploads/xxx.jpg" this component will build full URL.
 */

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("students");
  const [pendingStudents, setPendingStudents] = useState([]);
  const [approvedStudents, setApprovedStudents] = useState([]);
  const [pendingDrivers, setPendingDrivers] = useState([]);
  const [approvedDrivers, setApprovedDrivers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Keep this pointing to your API root (/api). We'll derive uploads root from it.
  const BACKEND_URL = "https://rydy-backend.onrender.com/api";

  // derive base URL (strip trailing '/api' if present)
  const uploadsBase = BACKEND_URL.endsWith("/api")
    ? BACKEND_URL.slice(0, -4)
    : BACKEND_URL.replace(/\/api\/?$/, "");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [
        pendingStudentsRes,
        approvedStudentsRes,
        pendingDriversRes,
        approvedDriversRes,
      ] = await Promise.all([
        fetch(`${BACKEND_URL}/students/pending`),
        fetch(`${BACKEND_URL}/students/approved`),
        fetch(`${BACKEND_URL}/drivers/pending`),
        fetch(`${BACKEND_URL}/drivers/approved`),
      ]);

      if (
        !pendingStudentsRes.ok ||
        !approvedStudentsRes.ok ||
        !pendingDriversRes.ok ||
        !approvedDriversRes.ok
      ) {
        throw new Error("One or more endpoints failed to fetch");
      }

      const [
        pendingStudentsData,
        approvedStudentsData,
        pendingDriversData,
        approvedDriversData,
      ] = await Promise.all([
        pendingStudentsRes.json(),
        approvedStudentsRes.json(),
        pendingDriversRes.json(),
        approvedDriversRes.json(),
      ]);

      setPendingStudents(pendingStudentsData);
      setApprovedStudents(approvedStudentsData);
      setPendingDrivers(pendingDriversData);
      setApprovedDrivers(approvedDriversData);
    } catch (err) {
      console.error("❌ Fetch error:", err);
      alert("Failed to load dashboard data. Please check backend connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApprove = async (type, id) => {
    try {
      const res = await fetch(`${BACKEND_URL}/${type}/approve/${id}`, {
        method: "PATCH",
      });
      if (!res.ok) throw new Error("Approval failed");
      alert("✅ Approved successfully");
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Failed to approve.");
    }
  };

  const handleReject = async (type, id) => {
    if (!window.confirm("Reject this user?")) return;
    try {
      const res = await fetch(`${BACKEND_URL}/${type}/reject/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Rejection failed");
      alert("❌ Rejected successfully");
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Failed to reject.");
    }
  };

  const handleDelete = async (type, id) => {
    if (!window.confirm("Delete this account permanently?")) return;
    try {
      const res = await fetch(`${BACKEND_URL}/${type}/delete/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Deletion failed");
      alert("🗑️ Account deleted successfully");
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Failed to delete account.");
    }
  };

  // helper: build image URL if record contains a path
  const buildImageUrl = (item) => {
    // common fields that might hold an uploaded image
    const possibleFields = ["idCardImage", "photo", "profileImage", "image"];
    for (const f of possibleFields) {
      const val = item?.[f];
      if (val) {
        // If value is already an absolute URL, return as-is
        if (typeof val === "string" && /^https?:\/\//.test(val)) return val;
        // ensure we don't duplicate leading slash
        const cleaned = val.startsWith("/") ? val.slice(1) : val;
        return `${uploadsBase}/${cleaned}`;
      }
    }
    return null;
  };

  // Render table rows - now includes Photo / Username for drivers
  const renderTable = (list, type, isApproved) => {
    // compute column count (Name + Photo + other columns + Actions)
    const columnsCount = type === "students" ? 5 : 6; // Name, Photo, University/Username, UniversityID/Age, (NIC), Actions
    return (
      <table style={styles.table}>
        <thead>
          <tr style={styles.tableHeader}>
            <th style={styles.th}>Name</th>
            <th style={styles.th}>Photo</th>

            {type === "students" ? (
              <>
                <th style={styles.th}>University</th>
                <th style={styles.th}>University ID</th>
              </>
            ) : (
              <>
                <th style={styles.th}>Username</th>
                <th style={styles.th}>Age</th>
                <th style={styles.th}>NIC</th>
              </>
            )}

            <th style={styles.th}>Actions</th>
          </tr>
        </thead>

        <tbody>
          {list.length === 0 ? (
            <tr>
              <td colSpan={columnsCount} style={styles.noData}>
                No {isApproved ? "approved" : "pending"} {type}.
              </td>
            </tr>
          ) : (
            list.map((item) => {
              const imgUrl = buildImageUrl(item);
              return (
                <tr key={item._id} style={styles.row}>
                  <td style={styles.td}>{item.name}</td>

                  <td style={styles.td}>
                    {imgUrl ? (
                      // show small clickable thumbnail opening full image in new tab
                      <a href={imgUrl} target="_blank" rel="noreferrer">
                        <img
                          src={imgUrl}
                          alt={`${item.name} photo`}
                          style={{ maxWidth: 80, maxHeight: 60, objectFit: "cover", borderRadius: 6 }}
                        />
                      </a>
                    ) : (
                      <span style={{ color: "#999", fontSize: 13 }}>No photo</span>
                    )}
                  </td>

                  {type === "students" ? (
                    <>
                      <td style={styles.td}>{item.universityName || "-"}</td>
                      <td style={styles.td}>{item.universityId || "-"}</td>
                    </>
                  ) : (
                    <>
                      <td style={styles.td}>{item.username || "-"}</td>
                      <td style={styles.td}>{item.age ?? "-"}</td>
                      <td style={styles.td}>{item.nic ?? "-"}</td>
                    </>
                  )}

                  <td style={styles.td}>
                    {!isApproved ? (
                      <>
                        <button style={styles.approveBtn} onClick={() => handleApprove(type, item._id)}>
                          ✅ Approve
                        </button>
                        <button style={styles.rejectBtn} onClick={() => handleReject(type, item._id)}>
                          ❌ Reject
                        </button>
                      </>
                    ) : (
                      <button style={styles.deleteBtn} onClick={() => handleDelete(type, item._id)}>
                        🗑️ Delete
                      </button>
                    )}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    );
  };

  if (loading) return <h3 style={{ textAlign: "center" }}>Loading dashboard...</h3>;

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>Admin Dashboard — Rydy 💜</h1>

      <div style={styles.tabs}>
        <button
          onClick={() => setActiveTab("students")}
          style={{
            ...styles.tabButton,
            backgroundColor: activeTab === "students" ? "#6A1B9A" : "#ddd",
            color: activeTab === "students" ? "#fff" : "#333",
          }}
        >
          🎓 Students
        </button>

        <button
          onClick={() => setActiveTab("drivers")}
          style={{
            ...styles.tabButton,
            backgroundColor: activeTab === "drivers" ? "#6A1B9A" : "#ddd",
            color: activeTab === "drivers" ? "#fff" : "#333",
          }}
        >
          🚗 Drivers
        </button>
      </div>

      {activeTab === "students" ? (
        <>
          <h2 style={styles.subheading}>Pending Students</h2>
          {renderTable(pendingStudents, "students", false)}
          <h2 style={styles.subheading}>Approved Students</h2>
          {renderTable(approvedStudents, "students", true)}
        </>
      ) : (
        <>
          <h2 style={styles.subheading}>Pending Drivers</h2>
          {renderTable(pendingDrivers, "drivers", false)}
          <h2 style={styles.subheading}>Approved Drivers</h2>
          {renderTable(approvedDrivers, "drivers", true)}
        </>
      )}
    </div>
  );
};

export default AdminDashboard;

// inline styles
const styles = {
  container: {
    padding: "30px",
    backgroundColor: "#f7f0ff",
    minHeight: "100vh",
  },
  heading: {
    textAlign: "center",
    color: "#6A1B9A",
    fontWeight: "800",
    fontSize: "28px",
    marginBottom: "30px",
  },
  tabs: {
    display: "flex",
    justifyContent: "center",
    marginBottom: "30px",
    gap: "10px",
  },
  tabButton: {
    padding: "10px 25px",
    border: "none",
    borderRadius: "25px",
    fontSize: "16px",
    cursor: "pointer",
    fontWeight: "600",
  },
  subheading: {
    color: "#6A1B9A",
    fontSize: "20px",
    marginTop: "20px",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: "10px",
    background: "#fff",
    borderRadius: "10px",
    overflow: "hidden",
  },
  tableHeader: { background: "#ead9ff" },
  th: {
    padding: "10px",
    textAlign: "left",
    color: "#6A1B9A",
    fontWeight: "700",
  },
  td: { padding: "10px", borderBottom: "1px solid #eee", color: "#333", verticalAlign: "middle" },
  noData: { textAlign: "center", padding: "20px", color: "#6A1B9A" },
  row: { backgroundColor: "#fff" },
  approveBtn: {
    backgroundColor: "#6A1B9A",
    color: "#fff",
    border: "none",
    padding: "6px 10px",
    marginRight: "8px",
    borderRadius: "8px",
    cursor: "pointer",
  },
  rejectBtn: {
    backgroundColor: "#e57373",
    color: "#fff",
    border: "none",
    padding: "6px 10px",
    borderRadius: "8px",
    cursor: "pointer",
  },
  deleteBtn: {
    backgroundColor: "#b71c1c",
    color: "#fff",
    border: "none",
    padding: "6px 10px",
    borderRadius: "8px",
    cursor: "pointer",
  },
};
