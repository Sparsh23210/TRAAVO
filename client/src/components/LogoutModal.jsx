import React, { useState } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../utils/firebase';
import './LogoutModal.css';

const LogoutModal = ({ isOpen, onClose, onLogoutSuccess }) => {
    const [loggingOut, setLoggingOut] = useState(false);

    const handleLogout = async () => {
        setLoggingOut(true);
        // Delay for animation "Logging you out..." (1s as requested)
        setTimeout(async () => {
            try {
                await signOut(auth);
                onLogoutSuccess();
                onClose();
            } catch (err) {
                console.error("Logout failed", err);
            } finally {
                setLoggingOut(false);
            }
        }, 1000);
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            {loggingOut ? (
                <div className="logout-modal-content">
                    <div className="logout-success-container">
                        <div className="logout-loader"></div>
                        <h1 className="logout-success-text">Logging you out...</h1>
                    </div>
                </div>
            ) : (
                <div className="logout-modal-content" onClick={e => e.stopPropagation()}>
                    <h2 className="logout-title">Logout?</h2>
                    <p className="logout-subtitle">Are you sure you want to log out of Traavo?</p>

                    <div className="logout-actions">
                        <button
                            className="logout-btn-no"
                            onClick={onClose}
                        >
                            No, stay
                        </button>
                        <button
                            className="logout-btn-yes"
                            onClick={handleLogout}
                        >
                            Yes, logout
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LogoutModal;
