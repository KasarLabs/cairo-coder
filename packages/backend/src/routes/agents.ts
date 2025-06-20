import { Router } from 'express';
import { handleChatCompletion } from './chatCompletionHandler';
import { listAgents, getAgent } from '@cairo-coder/agents';
import { ChatCompletionRequest } from '../types';

const router = Router();

// GET /v1/agents - List available agents
router.get('/', async (req, res) => {
  try {
    const agents = listAgents().map((agent) => ({
      id: agent.id,
      name: agent.name,
      description: agent.description,
      sources: agent.sources,
    }));

    res.json({
      agents,
      total: agents.length,
    });
  } catch (error) {
    console.error('Error listing agents:', error);
    res.status(500).json({
      error: {
        message: 'Failed to list agents',
        type: 'internal_error',
      },
    });
  }
});

// POST /v1/agents/:agentId/chat/completions - Agent-specific chat completions
router.post('/:agentId/chat/completions', async (req, res) => {
  const { agentId } = req.params;
  const request = req.body as ChatCompletionRequest;

  try {
    // Validate agent exists
    const agent = getAgent(agentId);
    if (!agent) {
      return res.status(404).json({
        error: {
          message: `Agent not found: ${agentId}`,
          type: 'invalid_request_error',
          param: 'agentId',
          code: 'agent_not_found',
        },
      });
    }

    // Use the shared handler with the specific agent ID
    await handleChatCompletion(req, res, { agentId });
  } catch (error) {
    console.error(
      `Error handling chat completion for agent ${agentId}:`,
      error,
    );
    res.status(500).json({
      error: {
        message: 'Internal server error',
        type: 'internal_error',
      },
    });
  }
});

export default router;
