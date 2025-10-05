import React from 'react';
import { toast } from 'sonner';
import { Button } from "@/components/ui/button";

export const NotificationTester = () => {
  const testNotifications = () => {
    // Test different types of notifications
    
    // Success notification (for likes, follows)
    toast.success('❤️ Someone liked your post!', {
      description: 'Your post is getting popular! Keep creating amazing content.',
      duration: 5000,
      action: {
        label: "View Post",
        onClick: () => console.log("Navigate to post")
      }
    });

    // Info notification (for comments)
    setTimeout(() => {
      toast.info('💬 New comment on your post', {
        description: 'Someone just commented on your latest post. Check it out!',
        duration: 5000,
        action: {
          label: "View Comment",
          onClick: () => console.log("Navigate to comment")
        }
      });
    }, 1000);

    // Follow notification
    setTimeout(() => {
      toast('👤 New follower!', {
        description: 'You have a new follower. Your network is growing!',
        duration: 5000,
        action: {
          label: "View Profile",
          onClick: () => console.log("Navigate to profile")
        }
      });
    }, 2000);

    // Reply notification
    setTimeout(() => {
      toast('↩️ Someone replied to your comment', {
        description: 'Continue the conversation and engage with your community.',
        duration: 5000,
        action: {
          label: "View Reply",
          onClick: () => console.log("Navigate to reply")
        }
      });
    }, 3000);
  };

  const testErrorNotification = () => {
    toast.error('❌ Connection lost', {
      description: 'Unable to connect to the server. Please check your internet connection.',
      duration: 6000,
      action: {
        label: "Retry",
        onClick: () => console.log("Retry connection")
      }
    });
  };

  const testWarningNotification = () => {
    toast.warning('⚠️ WebSocket disconnected', {
      description: 'Real-time notifications may be delayed. Attempting to reconnect...',
      duration: 4000
    });
  };

  return (
    <div className="p-4 space-y-4 bg-white rounded-lg shadow-lg">
      <h3 className="text-lg font-semibold text-slate-800">🔔 Notification Tester</h3>
      <div className="space-y-2">
        <Button onClick={testNotifications} className="w-full">
          Test Success Notifications
        </Button>
        <Button onClick={testErrorNotification} variant="destructive" className="w-full">
          Test Error Notification
        </Button>
        <Button onClick={testWarningNotification} variant="outline" className="w-full">
          Test Warning Notification
        </Button>
      </div>
      <p className="text-sm text-slate-600">
        Use these buttons to test the notification system and see instant feedback.
      </p>
    </div>
  );
};