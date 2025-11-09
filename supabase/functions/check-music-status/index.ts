import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { clipIds } = await req.json();
    console.log('Checking status for clips:', clipIds);

    const SUNO_API_KEY = Deno.env.get('SUNO_API_KEY');
    if (!SUNO_API_KEY) {
      console.error('SUNO_API_KEY is not configured');
      throw new Error('SUNO_API_KEY is not configured');
    }

    // Check status of all clips using SunoAPI.org
    const clipId = clipIds[0]; // Get first clip
    console.log('Checking clip ID:', clipId);
    
    const response = await fetch(`https://api.sunoapi.org/api/get?ids=${clipId}`, {
      method: 'GET',
      headers: {
        'api-key': SUNO_API_KEY,
      },
    });

    console.log('Suno API status check response:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Suno API error response:', response.status, errorText);
      throw new Error(`Suno API error: ${response.status} - ${errorText}`);
    }

    const clips = await response.json();
    console.log('Clip status response:', clips);
    
    const clip = clips[0];
    
    if (clip.status === 'complete') {
      return new Response(
        JSON.stringify({ 
          status: 'complete',
          audioUrl: clip.audio_url,
          title: clip.title,
          imageUrl: clip.image_url
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ status: clip.status || 'generating' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in check-music-status function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Status tekshirishda xatolik';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
