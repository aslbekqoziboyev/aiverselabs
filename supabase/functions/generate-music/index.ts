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
    const { prompt } = await req.json();
    console.log('Generating music with prompt:', prompt);

    const SUNO_API_KEY = Deno.env.get('SUNO_API_KEY');
    if (!SUNO_API_KEY) {
      console.error('SUNO_API_KEY is not configured');
      throw new Error('SUNO_API_KEY is not configured');
    }

    console.log('Calling Suno API...');
    
    // Create music generation request
    const response = await fetch('https://studio-api.suno.ai/api/external/generate/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUNO_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: prompt,
        make_instrumental: false,
        wait_audio: false
      }),
    });

    console.log('Suno API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Suno API error response:', response.status, errorText);
      throw new Error(`Suno API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Music generation started successfully:', data);
    
    // Return the clip IDs to poll for completion
    const clipIds = data.map((clip: any) => clip.id);

    return new Response(
      JSON.stringify({ clipIds, status: 'generating' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in generate-music function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Musiqa yaratishda xatolik yuz berdi';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
