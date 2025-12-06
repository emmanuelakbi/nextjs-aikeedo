/**
 * Marketing Materials Component
 * Requirements: Affiliate 4 - Access marketing materials
 */

'use client';

import { useEffect, useState } from 'react';
import Button from '@/components/ui/Button';

interface MarketingMaterialsProps {
  affiliateId: string;
}

export default function MarketingMaterials({
  affiliateId,
}: MarketingMaterialsProps) {
  const [materials, setMaterials] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        const response = await fetch('/api/affiliate/materials');
        if (response.ok) {
          const result = await response.json();
          setMaterials(result.data);
        }
      } catch (error) {
        console.error('Failed to fetch materials:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMaterials();
  }, [affiliateId]);

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (loading) {
    return (
      <div className="h-32 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!materials) {
    return (
      <div className="text-center py-8 text-gray-500">
        Failed to load marketing materials
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Text Snippets */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Text Snippets</h3>
        <div className="space-y-3">
          {materials.textSnippets?.map((snippet: any, index: number) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-medium text-gray-900">{snippet.title}</h4>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    copyToClipboard(snippet.content, `snippet-${index}`)
                  }
                >
                  {copied === `snippet-${index}` ? '✓ Copied' : 'Copy'}
                </Button>
              </div>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">
                {snippet.content}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Email Templates */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Email Templates</h3>
        <div className="space-y-3">
          {materials.emailTemplates?.map((template: any, index: number) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-medium text-gray-900">
                    {template.title}
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Subject: {template.subject}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    copyToClipboard(template.body, `email-${index}`)
                  }
                >
                  {copied === `email-${index}` ? '✓ Copied' : 'Copy'}
                </Button>
              </div>
              <p className="text-sm text-gray-600 whitespace-pre-wrap mt-3">
                {template.body}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Tracking Links */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Tracking Links</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {materials.trackingLinks &&
            Object.entries(materials.trackingLinks).map(
              ([key, url]: [string, any]) => (
                <div
                  key={key}
                  className="border border-gray-200 rounded-lg p-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 capitalize mb-1">
                        {key}
                      </p>
                      <p className="text-xs text-gray-600 truncate">{url}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(url, `link-${key}`)}
                      className="ml-2"
                    >
                      {copied === `link-${key}` ? '✓' : '📋'}
                    </Button>
                  </div>
                </div>
              )
            )}
        </div>
      </div>

      {/* Banner Images */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Banner Images</h3>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            📸 Banner images coming soon! We're creating professional marketing
            materials for you.
          </p>
        </div>
      </div>

      {/* Social Media */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Social Media</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {materials.socialImages?.map((social: any, index: number) => (
            <div
              key={index}
              className="border border-gray-200 rounded-lg p-4 text-center"
            >
              <div className="text-3xl mb-2">
                {social.platform === 'Twitter' && '🐦'}
                {social.platform === 'Facebook' && '📘'}
                {social.platform === 'Instagram' && '📷'}
              </div>
              <p className="font-medium text-gray-900 mb-1">
                {social.platform}
              </p>
              <p className="text-xs text-gray-600">{social.size}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
