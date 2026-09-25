"""LangGraph StateGraph wiring the CareerScope agents into a workflow."""
from langgraph.graph import END, START, StateGraph

from app.agents.nodes import (
    run_career_planner,
    run_insight,
    run_job_market,
    run_manager,
    run_persist,
    run_resume_analyzer,
    run_skill_gap,
    run_skill_intelligence,
)
from app.agents.state import WorkflowState


def build_graph():
    builder = StateGraph(WorkflowState)

    builder.add_node("manager", run_manager)
    builder.add_node("resume_analyzer", run_resume_analyzer)
    builder.add_node("job_market", run_job_market)
    builder.add_node("skill_intelligence", run_skill_intelligence)
    builder.add_node("skill_gap", run_skill_gap)
    builder.add_node("career_planner", run_career_planner)
    builder.add_node("insight", run_insight)
    builder.add_node("persist", run_persist)

    builder.add_edge(START, "manager")
    builder.add_edge("manager", "resume_analyzer")
    builder.add_edge("resume_analyzer", "job_market")
    builder.add_edge("job_market", "skill_intelligence")
    builder.add_edge("skill_intelligence", "skill_gap")
    builder.add_edge("skill_gap", "career_planner")
    builder.add_edge("career_planner", "insight")
    builder.add_edge("insight", "persist")
    builder.add_edge("persist", END)

    return builder.compile()


workflow = build_graph()