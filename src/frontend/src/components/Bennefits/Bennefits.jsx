// src/frontend/src/components/Bennefits/Bennefits.jsx
import { useState, useEffect, useRef } from 'react';
import styles from './Bennefits.module.css'; // Đảm bảo import đúng cách
import benefitImg from '../../assets/images/benefit.png'; // Đường dẫn ảnh đi lên 2 cấp

const AUTO_SLIDE_INTERVAL = 5000; // 5S giây

const pages = [
    {
        title: '🩺 Được tư vấn về sức khoẻ',
        icon: '⚕️',
        items: [
            'Được giải thích về quy trình hiến máu và các tai biến có thể xảy ra trong và sau khi hiến máu.',
            'Được cung cấp thông tin về dấu hiệu, triệu chứng do nhiễm vi rút viêm gan, HIV và một số bệnh lây qua đường truyền máu, tình dục khác.',
            'Được xét nghiệm sàng lọc một số vi rút lây qua đường truyền máu, tình dục (HIV, Giang mai, viêm gan,…) sau khi hiến máu.',
            'Được tư vấn hướng dẫn cách chăm sóc sức khỏe, tư vấn về kết quả bất thường sau hiến máu.',
            'Được bảo mật về kết quả khám lâm sàng, kết quả xét nghiệm.'
        ]
    },
    {
        title: '💰 Được bồi dưỡng trực tiếp',
        icon: '🎁',
        items: [
            'Ăn nhẹ, nước uống tại chỗ: tương đương 30.000 đồng (1 chai trà xanh không độ, 01 hộp chocopie 66gram, 01 hộp bánh Goute 35,5gram).',
            'Hỗ trợ chi phí đi lại (bằng tiền mặt): 50.000 đồng.',
            {
                label: 'Nhận phần quà tặng giá trị tương đương:',
                sub: [
                    '100.000đ khi hiến máu 250ml',
                    '150.000đ khi hiến máu 350ml',
                    '180.000đ khi hiến máu 450ml'
                ]
            }
        ]
    },
    {
        title: '📋 Được cấp Giấy chứng nhận hiến máu tình nguyện',
        icon: '🏆',
        items: [
            'Giấy chứng nhận được trao cho người hiến máu sau mỗi lần hiến máu tình nguyện.',
            'Có giá trị để được truyền máu miễn phí bằng số lượng máu đã hiến, khi bản thân người hiến có nhu cầu sử dụng máu tại tất cả các cơ sở y tế công lập trên toàn quốc.',
            'Người hiến máu cần xuất trình Giấy chứng nhận để làm cơ sở cho các cơ sở y tế thực hiện việc truyền máu miễn phí.',
            'Cơ sở y tế có trách nhiệm ký, đóng dấu, xác nhận số lượng máu đã truyền miễn phí cho người hiến máu vào giấy chứng nhận.'
        ]
    }
];

export default function Bennefits() {
    const [page, setPage] = useState(0);
    const [animating, setAnimating] = useState(false);
    const [direction, setDirection] = useState(0); // -1: left, 1: right
    const timeoutRef = useRef();
    const animTimeoutRef = useRef();

    // Auto slide effect
    useEffect(() => {
        timeoutRef.current && clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
            handleSlide(1);
        }, AUTO_SLIDE_INTERVAL);
        return () => clearTimeout(timeoutRef.current);
    }, [page]);

    // Slide animation
    function handleSlide(dir) {
        if (animating) return;
        setDirection(dir);
        setAnimating(true);
        animTimeoutRef.current && clearTimeout(animTimeoutRef.current);
        animTimeoutRef.current = setTimeout(() => {
            setPage(p => {
                let next = p + dir;
                if (next < 0) next = pages.length - 1;
                if (next >= pages.length) next = 0;
                return next;
            });
            setAnimating(false);
        }, 350);
    }

    // Kéo chuột để chuyển trang
    const dragState = useRef({ startX: 0, dragging: false });
    const handleDragStart = e => {
        dragState.current.startX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
        dragState.current.dragging = true;
    };
    const handleDragEnd = e => {
        if (!dragState.current.dragging) return;
        const endX = e.type === 'touchend' ? (e.changedTouches[0]?.clientX ?? 0) : e.clientX;
        const diff = endX - dragState.current.startX;
        if (diff > 60) handleSlide(-1);
        else if (diff < -60) handleSlide(1);
        dragState.current.dragging = false;
    };

    return (
        <section className={styles['benefit-section']}>
            <div className={styles['benefit-card']}>
                <div className={styles['benefit-img-container']}>
                    <img src={benefitImg} alt="Quyền lợi của người hiến máu" className={styles['benefit-img']} />
                    <div className={styles['benefit-overlay']}></div>
                    <h2 className={styles['benefit-title']}>
                        ❤️ Quyền lợi của người hiến máu
                    </h2>
                </div>
            </div>
            <div
                className={`${styles['benefit-card']} ${styles['benefit-content-card']}`}
                onMouseDown={handleDragStart}
                onMouseUp={handleDragEnd}
                onTouchStart={handleDragStart}
                onTouchEnd={handleDragEnd}
                style={{ cursor: 'grab', userSelect: 'none', position: 'relative', overflow: 'hidden' }}
            >
                <div className={styles['benefit-slide-container']}>
                    <div
                        className={`${styles['benefit-slide']}${animating ? (direction === 1 ? ` ${styles['slide-out-left']}` : ` ${styles['slide-out-right']}`) : ''}`}
                        key={page}
                    >
                        <div className={styles['benefit-header']}>
                            <div className={styles['benefit-icon']}>{pages[page].icon}</div>
                            <h3 className={styles['benefit-content-title']}>{pages[page].title}</h3>
                        </div>
                        <ul className={styles['benefit-list']}>
                            {pages[page].items.map((item, idx) =>
                                typeof item === 'string' ? (
                                    <li key={idx} className={styles['benefit-item']}>
                                        <span className={styles['benefit-bullet']}>•</span>
                                        {item}
                                    </li>
                                ) : (
                                    <li key={idx} className={styles['benefit-item-special']}>
                                        <span className={styles['benefit-bullet']}>•</span>
                                        {item.label}
                                        <ul className={styles['benefit-sub-list']}>
                                            {item.sub.map((sub, subIdx) => (
                                                <li key={subIdx} className={styles['benefit-sub-item']}>
                                                    <span className={styles['benefit-sub-bullet']}>→</span>
                                                    {sub}
                                                </li>
                                            ))}
                                        </ul>
                                    </li>
                                )
                            )}
                        </ul>
                    </div>
                </div>
                
                <div className={styles['benefit-nav']}>
                    <button
                        className={styles['benefit-arrow']}
                        onClick={() => handleSlide(-1)}
                        aria-label="Trang trước"
                    >
                        ←
                    </button>
                    <div className={styles['benefit-indicators']}>
                        {pages.map((_, index) => (
                            <button
                                key={index}
                                className={`${styles['benefit-indicator']} ${index === page ? styles['active'] : ''}`}
                                onClick={() => {
                                    if (index !== page) {
                                        setDirection(index > page ? 1 : -1);
                                        setPage(index);
                                    }
                                }}
                                aria-label={`Đi đến trang ${index + 1}`}
                            />
                        ))}
                    </div>
                    <button
                        className={styles['benefit-arrow']}
                        onClick={() => handleSlide(1)}
                        aria-label="Trang sau"
                    >
                        →
                    </button>
                </div>
            </div>
        </section>
    );
}