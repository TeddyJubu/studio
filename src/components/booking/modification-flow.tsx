"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, Clock, Users, AlertCircle, CheckCircle2, X } from 'lucide-react';
import type { Booking } from '@/services/booking-service';

interface ModificationFlowProps {
  booking: Booking;
  onModify: (updates: { date?: string; time?: string; partySize?: number }) => Promise<void>;
  onCancel: (reason?: string) => Promise<void>;
  onClose: () => void;
}

export function ModificationFlow({ booking, onModify, onCancel, onClose }: ModificationFlowProps) {
  const [mode, setMode] = useState<'view' | 'modify' | 'cancel'>('view');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Modification state
  const [newDate, setNewDate] = useState(booking.date || '');
  const [newTime, setNewTime] = useState(booking.time || '');
  const [newPartySize, setNewPartySize] = useState(booking.partySize || 2);

  // Cancellation state
  const [cancellationReason, setCancellationReason] = useState('');

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const handleModifySubmit = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const updates: { date?: string; time?: string; partySize?: number } = {};

      if (newDate !== booking.date) updates.date = newDate;
      if (newTime !== booking.time) updates.time = newTime;
      if (newPartySize !== booking.partySize) updates.partySize = newPartySize;

      if (Object.keys(updates).length === 0) {
        setError('No changes detected');
        setIsLoading(false);
        return;
      }

      await onModify(updates);
      setSuccess('Booking updated successfully!');
      setTimeout(() => {
        setMode('view');
        setSuccess(null);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update booking');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelSubmit = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await onCancel(cancellationReason || undefined);
      setSuccess('Booking cancelled successfully');
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel booking');
    } finally {
      setIsLoading(false);
    }
  };

  if (mode === 'view') {
    return (
      <Card className="my-2 max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Your Reservation</span>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </CardTitle>
          <CardDescription>
            Confirmation: {booking.confirmationCode}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {success && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Party Size</p>
                <p className="font-medium">{booking.partySize} guests</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Date</p>
                <p className="font-medium">{booking.date ? formatDate(booking.date) : 'Not set'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Time</p>
                <p className="font-medium">{booking.time ? formatTime(booking.time) : 'Not set'}</p>
              </div>
            </div>
          </div>

          {booking.occasion && (
            <div className="rounded-lg bg-muted p-3">
              <p className="text-sm text-muted-foreground">Occasion</p>
              <p className="text-sm">{booking.occasion}</p>
            </div>
          )}

          {booking.specialRequests && (
            <div className="rounded-lg bg-muted p-3">
              <p className="text-sm text-muted-foreground">Special Requests</p>
              <p className="text-sm">{booking.specialRequests}</p>
            </div>
          )}

          <div className="flex items-center gap-2 rounded-lg bg-muted p-3">
            <div className={`h-2 w-2 rounded-full ${
              booking.status === 'confirmed' ? 'bg-green-500' :
              booking.status === 'pending' ? 'bg-yellow-500' :
              booking.status === 'cancelled' ? 'bg-red-500' :
              'bg-gray-500'
            }`} />
            <p className="text-sm capitalize">{booking.status}</p>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setMode('modify')}
              disabled={booking.status === 'cancelled' || booking.status === 'completed'}
            >
              Modify Booking
            </Button>
            <Button
              variant="outline"
              onClick={() => setMode('cancel')}
              disabled={booking.status === 'cancelled' || booking.status === 'completed'}
              className="text-destructive hover:text-destructive"
            >
              Cancel Booking
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (mode === 'modify') {
    return (
      <Card className="my-2 max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Modify Reservation</span>
            <Button variant="ghost" size="icon" onClick={() => setMode('view')}>
              <X className="h-4 w-4" />
            </Button>
          </CardTitle>
          <CardDescription>
            Update your booking details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="partySize">Party Size</Label>
            <Input
              id="partySize"
              type="number"
              min="1"
              max="20"
              value={newPartySize}
              onChange={(e) => setNewPartySize(parseInt(e.target.value) || 1)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="time">Time</Label>
            <Input
              id="time"
              type="time"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
            />
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Changes to your booking are subject to availability. We'll confirm the new details shortly.
            </AlertDescription>
          </Alert>

          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleModifySubmit}
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? 'Updating...' : 'Confirm Changes'}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setMode('view');
                setNewDate(booking.date || '');
                setNewTime(booking.time || '');
                setNewPartySize(booking.partySize || 2);
                setError(null);
              }}
              disabled={isLoading}
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (mode === 'cancel') {
    return (
      <Card className="my-2 max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Cancel Reservation</span>
            <Button variant="ghost" size="icon" onClick={() => setMode('view')}>
              <X className="h-4 w-4" />
            </Button>
          </CardTitle>
          <CardDescription>
            Are you sure you want to cancel this booking?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This action cannot be undone. Your reservation for {booking.partySize} guests on {booking.date ? formatDate(booking.date) : 'the selected date'} at {booking.time ? formatTime(booking.time) : 'the selected time'} will be cancelled.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason for cancellation (optional)</Label>
            <Input
              id="reason"
              placeholder="e.g., Change of plans, scheduling conflict..."
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              variant="destructive"
              onClick={handleCancelSubmit}
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? 'Cancelling...' : 'Yes, Cancel Booking'}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setMode('view');
                setCancellationReason('');
                setError(null);
              }}
              disabled={isLoading}
            >
              Keep Booking
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}
