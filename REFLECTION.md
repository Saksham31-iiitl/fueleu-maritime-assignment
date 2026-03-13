# Reflection on AI-Assisted Development

## What I Learned Using AI Agents

Working with AI agents on this FuelEU Maritime compliance platform was an exercise in understanding the strengths and boundaries of current AI coding tools. The most valuable lesson was that **AI excels at translating well-defined specifications into code, but struggles with architectural judgment calls**.

When I provided the agent with clear formulas (CB = (Target − Actual) × Energy), precise constraints (pool sum ≥ 0, surplus cannot go negative), and explicit architecture rules (core must not import frameworks), the output was remarkably accurate. However, when tasks required nuanced decisions — like choosing between a timeline UI vs a table for banking records, or deciding how the greedy pool allocation should handle partial transfers — human judgment was essential.

I also learned that **prompt engineering is itself a skill**. Vague prompts like "build a dashboard" produced generic results. Specific prompts referencing exact color codes, component names, chart types, and data structures yielded production-quality code in a single pass.

## Efficiency Gains vs Manual Coding

The quantitative gains were significant:

- **Domain services** (pure logic): ~60% faster. The agent translated formulas and validation rules efficiently, though edge cases still needed manual attention.
- **Boilerplate** (Express routes, Prisma schema, React Query hooks): ~80% faster. This is where AI shines most — repetitive, pattern-based code.
- **UI components**: ~50% faster. The agent generated working Recharts configurations and Tailwind layouts, but styling refinement (dark mode, spacing, animation timing) was largely manual.
- **Testing**: ~70% faster. The agent generated test scaffolding and assertions quickly, but I needed to add edge cases it missed (zero-length arrays, boundary values).
- **Documentation**: ~40% faster. Structure was generated well, but content needed significant human editing for accuracy and voice.

Overall estimate: the project took roughly **40-50% less time** than fully manual development, with the caveat that review and correction time partially offsets generation speed.

## Improvements I'd Make Next Time

1. **Better prompt templates**: I'd create reusable prompt templates for each architectural layer (domain entity → port → use case → adapter), ensuring consistent output quality.

2. **Incremental testing strategy**: Rather than generating all code then testing, I'd adopt a tighter generate-test loop, verifying each domain function before moving to the next layer.

3. **Design system first**: I'd establish the complete design token system (colors, spacing, typography, component variants) before generating any UI code, reducing style inconsistencies.

4. **More edge case prompts**: I'd explicitly ask the agent to generate edge case tests alongside the main logic, rather than adding them after the fact.

5. **Architecture validation tooling**: I'd set up import linting rules (like eslint-plugin-boundaries) from the start to automatically enforce hexagonal architecture constraints, catching violations the agent might introduce.

The key takeaway: AI agents are powerful accelerators, but they work best as **skilled junior developers** who need clear specifications and code review, not as autonomous architects. The human developer's role shifts from writing every line to defining architecture, reviewing output, handling edge cases, and making design decisions — arguably more intellectually demanding, but significantly more productive.
