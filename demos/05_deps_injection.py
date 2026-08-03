"""Demo 5 — dependency injection: give the agent *your* app's context.

Tools rarely stand alone — they need a database handle, the current user,
API clients. Pydantic AI passes those in as typed `deps`, so tools stay
testable and nothing leaks in via globals.

Run:  python 05_deps_injection.py
"""

from dataclasses import dataclass

from pydantic_ai import Agent, RunContext

from _model import MODEL, banner, offline_override

# In real life: a DB pool, an http client, the authenticated user.
FAKE_DB = {
    "asha": ["MA2040 Probability", "CS2700 Data Structures"],
    "vikram": ["EE1101 Signals", "HS1090 Writing"],
}


@dataclass
class Deps:
    student_name: str
    db: dict[str, list[str]]


agent = Agent(
    MODEL,
    deps_type=Deps,
    instructions=(
        "You are a course advisor. Use the tools to look up real data; "
        "never invent enrollments."
    ),
)


@agent.tool
def my_courses(ctx: RunContext[Deps]) -> list[str]:
    """Courses the *current* student is enrolled in."""
    print(f"  [tool: my_courses for {ctx.deps.student_name!r}]")
    return ctx.deps.db.get(ctx.deps.student_name, [])


@agent.tool
def course_load(ctx: RunContext[Deps]) -> str:
    """How heavy the current student's semester is."""
    n = len(ctx.deps.db.get(ctx.deps.student_name, []))
    return f"{n} courses ({'light' if n <= 2 else 'heavy'})"


if __name__ == "__main__":
    banner()
    # Same agent, different user — deps are per-run, not baked into the agent.
    for student in ("asha", "vikram"):
        deps = Deps(student_name=student, db=FAKE_DB)
        with offline_override(agent):
            result = agent.run_sync("How is my semester looking?", deps=deps)
        print(f"{student}: {result.output}\n")
