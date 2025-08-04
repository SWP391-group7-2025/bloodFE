import React, { useState, useEffect } from 'react';

const RecoveryInfo = ({ lastDonationInfo }) => {
    const [timeLeft, setTimeLeft] = useState({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0
    });

    useEffect(() => {
        if (!lastDonationInfo || lastDonationInfo.canDonate) return;

        const calculateTimeLeft = () => {
            // Parse the Vietnamese date format (dd/mm/yyyy)
            const [day, month, year] = lastDonationInfo.canDonateDate.split('/');
            const targetDate = new Date(year, month - 1, day);
            const now = new Date();
            const difference = targetDate - now;

            if (difference > 0) {
                const days = Math.floor(difference / (1000 * 60 * 60 * 24));
                const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
                const minutes = Math.floor((difference / 1000 / 60) % 60);
                const seconds = Math.floor((difference / 1000) % 60);

                setTimeLeft({ days, hours, minutes, seconds });
            } else {
                setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
            }
        };

        calculateTimeLeft(); // Calculate immediately
        const timer = setInterval(calculateTimeLeft, 1000);

        return () => clearInterval(timer);
    }, [lastDonationInfo]);

    if (!lastDonationInfo) return null;

    if (lastDonationInfo.canDonate) {
        return (
            <div className="recovery-info success">
                <h4>🎉 Thông tin hồi phục</h4>
                <p><strong>Lần hiến máu cuối:</strong> {lastDonationInfo.lastDonationDate}</p>
                <p><strong>Số ngày đã qua:</strong> {lastDonationInfo.daysSinceLastDonation} ngày</p>

                <div className="recovery-status success-text">
                    ✅ Đã đủ thời gian hồi phục, có thể hiến máu
                </div>
            </div>
        );
    }

    return (
        <div className="recovery-info warning">
            <h4>⏳ Thông tin thời gian hồi phục</h4>

            <p><strong>Lần hiến máu cuối:</strong> {lastDonationInfo.lastDonationDate}</p>
            <p><strong>Số ngày đã qua:</strong> {lastDonationInfo.daysSinceLastDonation}/84 ngày</p>

            <div className="recovery-countdown">
                <div className="countdown-item">
                    <span className="countdown-number">{timeLeft.days}</span>
                    <span className="countdown-label">Ngày</span>
                </div>
                <div className="countdown-item">
                    <span className="countdown-number">{timeLeft.hours}</span>
                    <span className="countdown-label">Giờ</span>
                </div>
                <div className="countdown-item">
                    <span className="countdown-number">{timeLeft.minutes}</span>
                    <span className="countdown-label">Phút</span>
                </div>
                <div className="countdown-item">
                    <span className="countdown-number">{timeLeft.seconds}</span>
                    <span className="countdown-label">Giây</span>
                </div>
            </div>

            <div className="next-donation-info">
                <div className="next-donation-date">
                    Có thể hiến máu trở lại từ: {lastDonationInfo.canDonateDate}
                </div>
            </div>

            <div className="recovery-status warning-text">
                ⚠️ Chưa đủ thời gian hồi phục (còn {lastDonationInfo.remainingDays} ngày)
            </div>
        </div>
    );
};

export default RecoveryInfo;
