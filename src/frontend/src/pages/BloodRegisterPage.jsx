import React from 'react';
import { useSearchParams } from 'react-router-dom';
import BloodRegister from '../components/BloodRegister/BloodRegister';

export default function BloodRegisterPage() {
  const [searchParams] = useSearchParams();
  const appointmentId = searchParams.get('id'); // Lấy ID lịch từ URL

  return <BloodRegister appointmentId={appointmentId} />;
}
