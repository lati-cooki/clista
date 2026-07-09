// Generated from ClisTa-Protocol examples/manifest.json entry "pharma-phase-gate-multithreaded".
// Do not edit by hand — run `npm run sync:examples`.
export const example = {
  "id": "pharma-phase-gate-multithreaded",
  "title": "Pharma Phase II/III Go/No-Go — Multi-Arm (Octopus)",
  "summary": "A parent go/no-go that imports four arm-level decisions as CrossThreadEvidence. Three dissents survive the parent approval: two objections propagate from the arms (safety stopping rules, subgroup discipline) with the biostatistician minority report traceable two threads deep by hash, and a third originates at the go/no-go itself — the independent DSMB chair objecting that a single ~500-patient pivotal is an inadequate labeling safety database for a known hepatic signal (a dissent on whether to advance, not just how).",
  "kind": "multi-thread",
  "domain": "pharma",
  "entryThreadId": "thd_phase2_to_phase3_go_nogo_ltn4481",
  "threads": [
    {
      "role": "parent",
      "threadId": "thd_phase2_to_phase3_go_nogo_ltn4481",
      "events": [
        {
          "event_id": "evt_participantadded_par_cmo_mqyzlq90_8f838408",
          "event_type": "ParticipantAdded",
          "thread_id": "thd_phase2_to_phase3_go_nogo_ltn4481",
          "actor_id": "par_cmo",
          "timestamp": "2026-06-29T09:00:01.760Z",
          "payload": {
            "participant": {
              "id": "par_cmo",
              "object": "participant",
              "kind": "human",
              "name": "Dr. R. Vasquez",
              "role": "decision owner"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "content_hash": "sha256:8ba33d2b798b3881bca6624821d7d8e78ffc421938b611c6348a0e5bf3e7dfa1"
        },
        {
          "event_id": "evt_participantadded_par_biostat_mqyzlq9m_94b22202",
          "event_type": "ParticipantAdded",
          "thread_id": "thd_phase2_to_phase3_go_nogo_ltn4481",
          "actor_id": "par_biostat",
          "timestamp": "2026-06-29T09:00:01.782Z",
          "payload": {
            "participant": {
              "id": "par_biostat",
              "object": "participant",
              "kind": "human",
              "name": "Dr. K. Liang",
              "role": "lead biostatistician"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:8ba33d2b798b3881bca6624821d7d8e78ffc421938b611c6348a0e5bf3e7dfa1",
          "content_hash": "sha256:52126e56ffad33208d54a7a7ef5d60bf941033caedcd2c31ab951923d14ba8e3"
        },
        {
          "event_id": "evt_participantadded_par_clin_pharm_mqyzlqa8_c015334c",
          "event_type": "ParticipantAdded",
          "thread_id": "thd_phase2_to_phase3_go_nogo_ltn4481",
          "actor_id": "par_clin_pharm",
          "timestamp": "2026-06-29T09:00:01.804Z",
          "payload": {
            "participant": {
              "id": "par_clin_pharm",
              "object": "participant",
              "kind": "human",
              "name": "Dr. A. Osei",
              "role": "clinical pharmacologist"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:52126e56ffad33208d54a7a7ef5d60bf941033caedcd2c31ab951923d14ba8e3",
          "content_hash": "sha256:0377425464af12b4b27b404546738ff1c74fd805bb269ff184e0dc6b87bc542a"
        },
        {
          "event_id": "evt_participantadded_par_reg_affairs_mqyzlqau_4297deaf",
          "event_type": "ParticipantAdded",
          "thread_id": "thd_phase2_to_phase3_go_nogo_ltn4481",
          "actor_id": "par_reg_affairs",
          "timestamp": "2026-06-29T09:00:01.826Z",
          "payload": {
            "participant": {
              "id": "par_reg_affairs",
              "object": "participant",
              "kind": "human",
              "name": "J. Markova",
              "role": "vp regulatory affairs"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:0377425464af12b4b27b404546738ff1c74fd805bb269ff184e0dc6b87bc542a",
          "content_hash": "sha256:25503499121191e1b0421aba24ab73bfd95bb479ccd65ba5e4c61266f6be54f3"
        },
        {
          "event_id": "evt_participantadded_par_safety_officer_mqyzlqbg_2d62dfc1",
          "event_type": "ParticipantAdded",
          "thread_id": "thd_phase2_to_phase3_go_nogo_ltn4481",
          "actor_id": "par_safety_officer",
          "timestamp": "2026-06-29T09:00:01.848Z",
          "payload": {
            "participant": {
              "id": "par_safety_officer",
              "object": "participant",
              "kind": "human",
              "name": "Dr. T. Nakamura",
              "role": "drug safety officer"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:25503499121191e1b0421aba24ab73bfd95bb479ccd65ba5e4c61266f6be54f3",
          "content_hash": "sha256:fa2c91e295dbcd865994f7a53843c341eb7a781f45d2a164f5baf32e331fba8a"
        },
        {
          "event_id": "evt_participantadded_par_dsmb_chair_mqyzlqc2_b07e0fcc",
          "event_type": "ParticipantAdded",
          "thread_id": "thd_phase2_to_phase3_go_nogo_ltn4481",
          "actor_id": "par_dsmb_chair",
          "timestamp": "2026-06-29T09:00:01.870Z",
          "payload": {
            "participant": {
              "id": "par_dsmb_chair",
              "object": "participant",
              "kind": "human",
              "name": "Dr. E. Rowe",
              "role": "independent dsmb chair"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:fa2c91e295dbcd865994f7a53843c341eb7a781f45d2a164f5baf32e331fba8a",
          "content_hash": "sha256:8d261da6716db08721af87962caa49c32b116d912d81ed6675cd5b4d5f383a91"
        },
        {
          "event_id": "evt_participantadded_par_octopus_mqyzlqco_bc4890ea",
          "event_type": "ParticipantAdded",
          "thread_id": "thd_phase2_to_phase3_go_nogo_ltn4481",
          "actor_id": "par_octopus",
          "timestamp": "2026-06-29T09:00:01.892Z",
          "payload": {
            "participant": {
              "id": "par_octopus",
              "object": "participant",
              "kind": "agent",
              "name": "Octopus",
              "role": "execution orchestrator"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:8d261da6716db08721af87962caa49c32b116d912d81ed6675cd5b4d5f383a91",
          "content_hash": "sha256:898cad98044ce98ea898867e0f5274421dc097a003cb842374b99c0cccd2f061"
        },
        {
          "event_id": "evt_threadcreated_thd_phase2_to_phase3_go_nogo_ltn4481_mqyzlqda_a9dfd702",
          "event_type": "ThreadCreated",
          "thread_id": "thd_phase2_to_phase3_go_nogo_ltn4481",
          "actor_id": "par_cmo",
          "timestamp": "2026-06-29T09:00:01.914Z",
          "payload": {
            "thread": {
              "id": "thd_phase2_to_phase3_go_nogo_ltn4481",
              "object": "thread",
              "title": "Phase II/III Go/No-Go — LTN-4481 (Moderate-to-Severe Ulcerative Colitis)",
              "question": "Should LTN-4481 advance from Phase II to Phase III based on arm-level workstream outputs?",
              "status": "active",
              "participantIds": [
                "par_cmo",
                "par_biostat",
                "par_clin_pharm",
                "par_reg_affairs",
                "par_safety_officer",
                "par_dsmb_chair",
                "par_octopus"
              ],
              "createdAt": "2026-06-29T09:00:00.000Z",
              "updatedAt": "2026-06-29T09:00:00.000Z"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:898cad98044ce98ea898867e0f5274421dc097a003cb842374b99c0cccd2f061",
          "content_hash": "sha256:53839bb18478f631a66707d6962ac55d0b01b411d6743afa2a94ac02af07c753"
        },
        {
          "event_id": "evt_delegationgranted_dlg_pkpd_mqyzlqdw_7dcd5b00",
          "event_type": "DelegationGranted",
          "thread_id": "thd_phase2_to_phase3_go_nogo_ltn4481",
          "actor_id": "par_cmo",
          "timestamp": "2026-06-29T09:00:01.936Z",
          "payload": {
            "delegationGrant": {
              "id": "dlg_pkpd",
              "object": "delegationGrant",
              "threadId": "thd_phase2_to_phase3_go_nogo_ltn4481",
              "delegatorParticipantId": "par_cmo",
              "delegateId": "par_octopus",
              "delegateType": "participant",
              "action": "pkpd-modeling",
              "scope": "thread:thd_phase2_to_phase3_go_nogo_ltn4481",
              "authorityRequired": "decision_owner",
              "limits": [
                "scope:thread:thd_phase2_to_phase3_go_nogo_ltn4481"
              ],
              "summary": "Octopus delegated to execute PK/PD modeling arm",
              "status": "active",
              "grantedBy": "par_cmo",
              "grantedAt": "2026-06-29T09:00:01.958Z",
              "expiresAt": null,
              "attributionRequired": true,
              "authoritySurrender": false,
              "authorityTransfer": false,
              "automaticConsensus": false,
              "delegatedConsensus": false,
              "delegationWithoutAttribution": false,
              "governanceMutation": false,
              "implicitGovernanceChange": false,
              "permanentAuthorityTransfer": false,
              "unboundedAction": false
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:53839bb18478f631a66707d6962ac55d0b01b411d6743afa2a94ac02af07c753",
          "content_hash": "sha256:ef18999a3362084eac17cfd767413565d93538bb008ccb6d6829c08895683066"
        },
        {
          "event_id": "evt_delegationgranted_dlg_safety_mqyzlqei_0c5407c5",
          "event_type": "DelegationGranted",
          "thread_id": "thd_phase2_to_phase3_go_nogo_ltn4481",
          "actor_id": "par_cmo",
          "timestamp": "2026-06-29T09:00:01.980Z",
          "payload": {
            "delegationGrant": {
              "id": "dlg_safety",
              "object": "delegationGrant",
              "threadId": "thd_phase2_to_phase3_go_nogo_ltn4481",
              "delegatorParticipantId": "par_cmo",
              "delegateId": "par_octopus",
              "delegateType": "participant",
              "action": "safety-signal-assessment",
              "scope": "thread:thd_phase2_to_phase3_go_nogo_ltn4481",
              "authorityRequired": "decision_owner",
              "limits": [
                "scope:thread:thd_phase2_to_phase3_go_nogo_ltn4481"
              ],
              "summary": "Octopus delegated to execute safety signal assessment arm",
              "status": "active",
              "grantedBy": "par_cmo",
              "grantedAt": "2026-06-29T09:00:02.002Z",
              "expiresAt": null,
              "attributionRequired": true,
              "authoritySurrender": false,
              "authorityTransfer": false,
              "automaticConsensus": false,
              "delegatedConsensus": false,
              "delegationWithoutAttribution": false,
              "governanceMutation": false,
              "implicitGovernanceChange": false,
              "permanentAuthorityTransfer": false,
              "unboundedAction": false
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:ef18999a3362084eac17cfd767413565d93538bb008ccb6d6829c08895683066",
          "content_hash": "sha256:8024bb9ed65463f5f16ad0fb4283f44793f2551d17f6e85556448a8a8984b766"
        },
        {
          "event_id": "evt_delegationgranted_dlg_subgroup_mqyzlqf4_44249e76",
          "event_type": "DelegationGranted",
          "thread_id": "thd_phase2_to_phase3_go_nogo_ltn4481",
          "actor_id": "par_cmo",
          "timestamp": "2026-06-29T09:00:02.024Z",
          "payload": {
            "delegationGrant": {
              "id": "dlg_subgroup",
              "object": "delegationGrant",
              "threadId": "thd_phase2_to_phase3_go_nogo_ltn4481",
              "delegatorParticipantId": "par_cmo",
              "delegateId": "par_octopus",
              "delegateType": "participant",
              "action": "subgroup-analysis-review",
              "scope": "thread:thd_phase2_to_phase3_go_nogo_ltn4481",
              "authorityRequired": "decision_owner",
              "limits": [
                "scope:thread:thd_phase2_to_phase3_go_nogo_ltn4481"
              ],
              "summary": "Octopus delegated to execute subgroup analysis review arm",
              "status": "active",
              "grantedBy": "par_cmo",
              "grantedAt": "2026-06-29T09:00:02.046Z",
              "expiresAt": null,
              "attributionRequired": true,
              "authoritySurrender": false,
              "authorityTransfer": false,
              "automaticConsensus": false,
              "delegatedConsensus": false,
              "delegationWithoutAttribution": false,
              "governanceMutation": false,
              "implicitGovernanceChange": false,
              "permanentAuthorityTransfer": false,
              "unboundedAction": false
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:8024bb9ed65463f5f16ad0fb4283f44793f2551d17f6e85556448a8a8984b766",
          "content_hash": "sha256:0405c7f877fde58c7c9c010e71a038d64794fb074b0fe257ca0f3b5ec9fad6c8"
        },
        {
          "event_id": "evt_delegationgranted_dlg_reg_mqyzlqfq_3add5745",
          "event_type": "DelegationGranted",
          "thread_id": "thd_phase2_to_phase3_go_nogo_ltn4481",
          "actor_id": "par_cmo",
          "timestamp": "2026-06-29T09:00:02.068Z",
          "payload": {
            "delegationGrant": {
              "id": "dlg_reg",
              "object": "delegationGrant",
              "threadId": "thd_phase2_to_phase3_go_nogo_ltn4481",
              "delegatorParticipantId": "par_cmo",
              "delegateId": "par_octopus",
              "delegateType": "participant",
              "action": "regulatory-strategy",
              "scope": "thread:thd_phase2_to_phase3_go_nogo_ltn4481",
              "authorityRequired": "decision_owner",
              "limits": [
                "scope:thread:thd_phase2_to_phase3_go_nogo_ltn4481"
              ],
              "summary": "Octopus delegated to execute regulatory strategy arm",
              "status": "active",
              "grantedBy": "par_cmo",
              "grantedAt": "2026-06-29T09:00:02.090Z",
              "expiresAt": null,
              "attributionRequired": true,
              "authoritySurrender": false,
              "authorityTransfer": false,
              "automaticConsensus": false,
              "delegatedConsensus": false,
              "delegationWithoutAttribution": false,
              "governanceMutation": false,
              "implicitGovernanceChange": false,
              "permanentAuthorityTransfer": false,
              "unboundedAction": false
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:0405c7f877fde58c7c9c010e71a038d64794fb074b0fe257ca0f3b5ec9fad6c8",
          "content_hash": "sha256:802c7993d197f0a8373fc9c538242ab04cff09b17751d4a68295d2159e62b4ff"
        },
        {
          "event_id": "evt_executionstarted_exe_pkpd_mqyzlqgc_c9e82126",
          "event_type": "ExecutionStarted",
          "thread_id": "thd_phase2_to_phase3_go_nogo_ltn4481",
          "actor_id": "par_octopus",
          "timestamp": "2026-06-29T09:00:02.112Z",
          "payload": {
            "executionRecord": {
              "id": "exe_pkpd",
              "object": "executionRecord",
              "threadId": "thd_phase2_to_phase3_go_nogo_ltn4481",
              "actorId": "par_octopus",
              "authorizationRef": {
                "type": "delegation",
                "id": "dlg_pkpd"
              },
              "decisionId": null,
              "actionType": "pkpd-modeling",
              "scope": "thread:thd_phase2_to_phase3_go_nogo_ltn4481",
              "constraints": [
                "scope:thread:thd_phase2_to_phase3_go_nogo_ltn4481"
              ],
              "status": "active",
              "startedAt": "2026-06-29T09:00:02.134Z",
              "attribution": {
                "actorId": "par_octopus",
                "authorizationRef": {
                  "type": "delegation",
                  "id": "dlg_pkpd"
                },
                "delegationId": "dlg_pkpd",
                "decisionId": null
              },
              "delegationId": "dlg_pkpd"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:802c7993d197f0a8373fc9c538242ab04cff09b17751d4a68295d2159e62b4ff",
          "content_hash": "sha256:4f2e302d65a4d696f0337938b7167405f728ba92771c5abb04accfa8311de647"
        },
        {
          "event_id": "evt_executionstarted_exe_safety_mqyzlqgy_8fd3b362",
          "event_type": "ExecutionStarted",
          "thread_id": "thd_phase2_to_phase3_go_nogo_ltn4481",
          "actor_id": "par_octopus",
          "timestamp": "2026-06-29T09:00:02.156Z",
          "payload": {
            "executionRecord": {
              "id": "exe_safety",
              "object": "executionRecord",
              "threadId": "thd_phase2_to_phase3_go_nogo_ltn4481",
              "actorId": "par_octopus",
              "authorizationRef": {
                "type": "delegation",
                "id": "dlg_safety"
              },
              "decisionId": null,
              "actionType": "safety-signal-assessment",
              "scope": "thread:thd_phase2_to_phase3_go_nogo_ltn4481",
              "constraints": [
                "scope:thread:thd_phase2_to_phase3_go_nogo_ltn4481"
              ],
              "status": "active",
              "startedAt": "2026-06-29T09:00:02.178Z",
              "attribution": {
                "actorId": "par_octopus",
                "authorizationRef": {
                  "type": "delegation",
                  "id": "dlg_safety"
                },
                "delegationId": "dlg_safety",
                "decisionId": null
              },
              "delegationId": "dlg_safety"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:4f2e302d65a4d696f0337938b7167405f728ba92771c5abb04accfa8311de647",
          "content_hash": "sha256:bb777838af5a4702a022c6dc6d6eed1f48d50e985afed39abc6fd9c0cc709ea2"
        },
        {
          "event_id": "evt_executionstarted_exe_subgroup_mqyzlqhk_fac22e55",
          "event_type": "ExecutionStarted",
          "thread_id": "thd_phase2_to_phase3_go_nogo_ltn4481",
          "actor_id": "par_octopus",
          "timestamp": "2026-06-29T09:00:02.200Z",
          "payload": {
            "executionRecord": {
              "id": "exe_subgroup",
              "object": "executionRecord",
              "threadId": "thd_phase2_to_phase3_go_nogo_ltn4481",
              "actorId": "par_octopus",
              "authorizationRef": {
                "type": "delegation",
                "id": "dlg_subgroup"
              },
              "decisionId": null,
              "actionType": "subgroup-analysis-review",
              "scope": "thread:thd_phase2_to_phase3_go_nogo_ltn4481",
              "constraints": [
                "scope:thread:thd_phase2_to_phase3_go_nogo_ltn4481"
              ],
              "status": "active",
              "startedAt": "2026-06-29T09:00:02.222Z",
              "attribution": {
                "actorId": "par_octopus",
                "authorizationRef": {
                  "type": "delegation",
                  "id": "dlg_subgroup"
                },
                "delegationId": "dlg_subgroup",
                "decisionId": null
              },
              "delegationId": "dlg_subgroup"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:bb777838af5a4702a022c6dc6d6eed1f48d50e985afed39abc6fd9c0cc709ea2",
          "content_hash": "sha256:de75dd3b71e0d1f4a5958e7ce56b75a747b476baa6662e92a6c2bb77cd6d628b"
        },
        {
          "event_id": "evt_executionstarted_exe_reg_mqyzlqi6_f0da9153",
          "event_type": "ExecutionStarted",
          "thread_id": "thd_phase2_to_phase3_go_nogo_ltn4481",
          "actor_id": "par_octopus",
          "timestamp": "2026-06-29T09:00:02.244Z",
          "payload": {
            "executionRecord": {
              "id": "exe_reg",
              "object": "executionRecord",
              "threadId": "thd_phase2_to_phase3_go_nogo_ltn4481",
              "actorId": "par_octopus",
              "authorizationRef": {
                "type": "delegation",
                "id": "dlg_reg"
              },
              "decisionId": null,
              "actionType": "regulatory-strategy",
              "scope": "thread:thd_phase2_to_phase3_go_nogo_ltn4481",
              "constraints": [
                "scope:thread:thd_phase2_to_phase3_go_nogo_ltn4481"
              ],
              "status": "active",
              "startedAt": "2026-06-29T09:00:02.266Z",
              "attribution": {
                "actorId": "par_octopus",
                "authorizationRef": {
                  "type": "delegation",
                  "id": "dlg_reg"
                },
                "delegationId": "dlg_reg",
                "decisionId": null
              },
              "delegationId": "dlg_reg"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:de75dd3b71e0d1f4a5958e7ce56b75a747b476baa6662e92a6c2bb77cd6d628b",
          "content_hash": "sha256:16801e4c22a20dffca169e61de0acfa3e0329aee37e712a4ed654b5dda4a9b7d"
        },
        {
          "event_id": "evt_crossthreadevidence_cte_pkpd_output_mqyzlqis_da0b90ae",
          "event_type": "CrossThreadEvidence",
          "thread_id": "thd_phase2_to_phase3_go_nogo_ltn4481",
          "actor_id": "par_clin_pharm",
          "timestamp": "2026-06-29T09:00:02.288Z",
          "payload": {
            "crossThreadEvidence": {
              "id": "cte_pkpd_output",
              "object": "crossThreadEvidence",
              "threadId": "thd_phase2_to_phase3_go_nogo_ltn4481",
              "sourceThreadId": "thd_arm_pkpd_modeling_ltn4481",
              "sourceDecisionRecordId": "dcr_pkpd_dose_confirmed",
              "sourceEventHash": "sha256:d63ab532dae873091e72af85de8c4c9f83c12176a4f0705d3c2b60f4011af14f",
              "derivation": "decision_output",
              "finding": "200mg Q4W dose confirmed by exposure-response modeling. Cmin correlates with endoscopic improvement (R-squared 0.71). Early PK sampling at weeks 4 and 12 required. Dose adjustment pathway triggers if observed exposure deviates more than 30 percent from model prediction.",
              "confidence": 0.84,
              "committedByParticipantId": "par_clin_pharm",
              "committedAt": "2026-06-29T09:00:02.288Z",
              "contentHash": "sha256:cte_cte_pkpd_output"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:16801e4c22a20dffca169e61de0acfa3e0329aee37e712a4ed654b5dda4a9b7d",
          "content_hash": "sha256:ffff8b6a1f35f89c5fe97a9c56ef80f056bb75561ea7e5dfc437e09c9497d27c"
        },
        {
          "event_id": "evt_crossthreadevidence_cte_safety_output_mqyzlqje_1512423c",
          "event_type": "CrossThreadEvidence",
          "thread_id": "thd_phase2_to_phase3_go_nogo_ltn4481",
          "actor_id": "par_safety_officer",
          "timestamp": "2026-06-29T09:00:02.310Z",
          "payload": {
            "crossThreadEvidence": {
              "id": "cte_safety_output",
              "object": "crossThreadEvidence",
              "threadId": "thd_phase2_to_phase3_go_nogo_ltn4481",
              "sourceThreadId": "thd_arm_safety_assessment_ltn4481",
              "sourceDecisionRecordId": "dcr_safety_acceptable",
              "sourceEventHash": "sha256:7db7d90f21a043a1e5a2dc5d3709620c98b776c6bf1b1e96018224910ed51eda",
              "derivation": "decision_output",
              "finding": "Safety profile acceptable for Phase III with three hard-gated conditions: baseline ALT greater than 2x ULN exclusion, biweekly ALT/AST monitoring for 12 weeks, and quantitative hepatic stopping rules finalized before first patient dosed. Stopping rules condition is a preserved objection from the safety arm.",
              "confidence": 0.79,
              "committedByParticipantId": "par_safety_officer",
              "committedAt": "2026-06-29T09:00:02.310Z",
              "contentHash": "sha256:cte_cte_safety_output"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:ffff8b6a1f35f89c5fe97a9c56ef80f056bb75561ea7e5dfc437e09c9497d27c",
          "content_hash": "sha256:a852ccdad8cd1e63d72b1290b69e7bf0d2997674cae405e54cb1c46926e6d02e"
        },
        {
          "event_id": "evt_crossthreadevidence_cte_safety_objection_mqyzlqk0_9feb8109",
          "event_type": "CrossThreadEvidence",
          "thread_id": "thd_phase2_to_phase3_go_nogo_ltn4481",
          "actor_id": "par_safety_officer",
          "timestamp": "2026-06-29T09:00:02.332Z",
          "payload": {
            "crossThreadEvidence": {
              "id": "cte_safety_objection",
              "object": "crossThreadEvidence",
              "threadId": "thd_phase2_to_phase3_go_nogo_ltn4481",
              "sourceThreadId": "thd_arm_safety_assessment_ltn4481",
              "sourceDecisionRecordId": "dcr_safety_acceptable",
              "sourceEventHash": "sha256:7db7d90f21a043a1e5a2dc5d3709620c98b776c6bf1b1e96018224910ed51eda",
              "derivation": "preserved_objection",
              "finding": "Hepatic stopping rules must be finalized before first patient dosed. Monitoring without quantitative stopping criteria is not a safety plan. This objection survived the arm-level decision and propagates to the parent.",
              "confidence": 0.91,
              "committedByParticipantId": "par_safety_officer",
              "committedAt": "2026-06-29T09:00:02.332Z",
              "contentHash": "sha256:cte_cte_safety_objection"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:a852ccdad8cd1e63d72b1290b69e7bf0d2997674cae405e54cb1c46926e6d02e",
          "content_hash": "sha256:add2d10e2fd78cda2021190258c5cbe208f42b76a19c4628d40297ce7d3c54f0"
        },
        {
          "event_id": "evt_crossthreadevidence_cte_subgroup_output_mqyzlqkm_fb22d7e4",
          "event_type": "CrossThreadEvidence",
          "thread_id": "thd_phase2_to_phase3_go_nogo_ltn4481",
          "actor_id": "par_biostat",
          "timestamp": "2026-06-29T09:00:02.354Z",
          "payload": {
            "crossThreadEvidence": {
              "id": "cte_subgroup_output",
              "object": "crossThreadEvidence",
              "threadId": "thd_phase2_to_phase3_go_nogo_ltn4481",
              "sourceThreadId": "thd_arm_subgroup_review_ltn4481",
              "sourceDecisionRecordId": "dcr_subgroup_exploratory",
              "sourceEventHash": "sha256:a5f9103437abca655d87f3b55d9c772c37356241155c7466cb20be02139adf47",
              "derivation": "decision_output",
              "finding": "Bio-failure subgroup designated exploratory only. No alpha allocation, no enrichment, no stratification in Phase III primary analysis. Lead biostatistician filed proactive minority report documenting risk of organizational pressure to promote the finding.",
              "confidence": 0.72,
              "committedByParticipantId": "par_biostat",
              "committedAt": "2026-06-29T09:00:02.354Z",
              "contentHash": "sha256:cte_cte_subgroup_output"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:add2d10e2fd78cda2021190258c5cbe208f42b76a19c4628d40297ce7d3c54f0",
          "content_hash": "sha256:4dedef8df1da0358053238253d4452af21dfe630fad9dfe687865295cabea708"
        },
        {
          "event_id": "evt_crossthreadevidence_cte_subgroup_minority_mqyzlql8_d619f7d1",
          "event_type": "CrossThreadEvidence",
          "thread_id": "thd_phase2_to_phase3_go_nogo_ltn4481",
          "actor_id": "par_biostat",
          "timestamp": "2026-06-29T09:00:02.376Z",
          "payload": {
            "crossThreadEvidence": {
              "id": "cte_subgroup_minority",
              "object": "crossThreadEvidence",
              "threadId": "thd_phase2_to_phase3_go_nogo_ltn4481",
              "sourceThreadId": "thd_arm_subgroup_review_ltn4481",
              "sourceDecisionRecordId": "dcr_subgroup_exploratory",
              "sourceEventHash": "sha256:a5f9103437abca655d87f3b55d9c772c37356241155c7466cb20be02139adf47",
              "derivation": "minority_report",
              "finding": "Biostatistician minority report: any future protocol amendment promoting the bio-failure subgroup from exploratory to confirmatory was flagged as a statistical integrity risk at the earliest decision point. Traceable for TMF.",
              "confidence": 0.95,
              "committedByParticipantId": "par_biostat",
              "committedAt": "2026-06-29T09:00:02.376Z",
              "contentHash": "sha256:cte_cte_subgroup_minority"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:4dedef8df1da0358053238253d4452af21dfe630fad9dfe687865295cabea708",
          "content_hash": "sha256:83f978f699ca44b25c43068166d2bf302e7470e5f8bdc409b6b4ad2c8920efc2"
        },
        {
          "event_id": "evt_crossthreadevidence_cte_reg_output_mqyzlqlu_8b37e5af",
          "event_type": "CrossThreadEvidence",
          "thread_id": "thd_phase2_to_phase3_go_nogo_ltn4481",
          "actor_id": "par_reg_affairs",
          "timestamp": "2026-06-29T09:00:02.398Z",
          "payload": {
            "crossThreadEvidence": {
              "id": "cte_reg_output",
              "object": "crossThreadEvidence",
              "threadId": "thd_phase2_to_phase3_go_nogo_ltn4481",
              "sourceThreadId": "thd_arm_regulatory_strategy_ltn4481",
              "sourceDecisionRecordId": "dcr_reg_strategy_confirmed",
              "sourceEventHash": "sha256:e6466f7151fc97f0e03616a746626bb4bbc10d55e966a988a642e2b52b93d9ae",
              "derivation": "decision_output",
              "finding": "Single pivotal trial strategy confirmed. Adaptive design with interim futility, at least 500 patients, hepatic monitoring plan per FDA Type B meeting alignment. IND amendment to reference meeting minutes.",
              "confidence": 0.95,
              "committedByParticipantId": "par_reg_affairs",
              "committedAt": "2026-06-29T09:00:02.398Z",
              "contentHash": "sha256:cte_cte_reg_output"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:83f978f699ca44b25c43068166d2bf302e7470e5f8bdc409b6b4ad2c8920efc2",
          "content_hash": "sha256:96ed2433d7884c3f03a661cc86a597a2b92e2f7e2d4d7089d7edc25d63a45995"
        },
        {
          "event_id": "evt_evidencecommitted_evd_phase2_topline_mqyzlqmg_e7d1f2c4",
          "event_type": "EvidenceCommitted",
          "thread_id": "thd_phase2_to_phase3_go_nogo_ltn4481",
          "actor_id": "par_cmo",
          "timestamp": "2026-06-29T09:00:02.420Z",
          "payload": {
            "evidence": {
              "id": "evd_phase2_topline",
              "object": "evidence",
              "threadId": "thd_phase2_to_phase3_go_nogo_ltn4481",
              "source": "LTN-4481 Phase II top-line results (Study 4481-201, N=347)",
              "finding": "Modified Mayo Score remission at week 16: 38.2 percent (200mg) vs 12.1 percent (placebo), p<0.001. Endoscopic improvement: 52.4 percent vs 21.8 percent.",
              "confidence": 0.91,
              "committedByParticipantId": "par_cmo",
              "committedAt": "2026-06-29T09:00:02.420Z",
              "artifactIds": [],
              "contentHash": "sha256:arm_evd_phase2_topline"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:96ed2433d7884c3f03a661cc86a597a2b92e2f7e2d4d7089d7edc25d63a45995",
          "content_hash": "sha256:03ef498a3be4b4b00551510ce251809547960e52e3a1fcbdfa4f3618423dc3fb"
        },
        {
          "event_id": "evt_assumptiondeclared_asm_arms_converge_mqyzlqn2_52936097",
          "event_type": "AssumptionDeclared",
          "thread_id": "thd_phase2_to_phase3_go_nogo_ltn4481",
          "actor_id": "par_cmo",
          "timestamp": "2026-06-29T09:00:02.442Z",
          "payload": {
            "assumption": {
              "id": "asm_arms_converge",
              "object": "assumption",
              "threadId": "thd_phase2_to_phase3_go_nogo_ltn4481",
              "text": "All four arm-level decisions support advancement, each with binding conditions. Advancement is conditional, not unconditional: the safety arm's hepatic stopping-rules gate is a hard precondition, so 'no blocking finding' overstates — no arm blocked outright, but the safety gate must clear before dosing.",
              "status": "active",
              "evidenceIds": [
                "cte_pkpd_output",
                "cte_safety_output",
                "cte_subgroup_output",
                "cte_reg_output"
              ],
              "confidence": 0.8,
              "declaredByParticipantId": "par_cmo",
              "declaredAt": "2026-06-29T09:00:02.442Z",
              "contentHash": "sha256:arm_asm_arms_converge"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:03ef498a3be4b4b00551510ce251809547960e52e3a1fcbdfa4f3618423dc3fb",
          "content_hash": "sha256:0bbdbf09af8d97b126c7ee112a7eb935c5f74910ce441ef0913b7d866f1a7409"
        },
        {
          "event_id": "evt_claimcreated_clm_go_supported_mqyzlqno_d3b9ef18",
          "event_type": "ClaimCreated",
          "thread_id": "thd_phase2_to_phase3_go_nogo_ltn4481",
          "actor_id": "par_cmo",
          "timestamp": "2026-06-29T09:00:02.464Z",
          "payload": {
            "claim": {
              "id": "clm_go_supported",
              "object": "claim",
              "threadId": "thd_phase2_to_phase3_go_nogo_ltn4481",
              "text": "Phase III advancement is supported by converging arm-level decisions on dose, safety, subgroup discipline, and regulatory path.",
              "status": "endorsed",
              "evidenceIds": [
                "cte_pkpd_output",
                "cte_safety_output",
                "cte_subgroup_output",
                "cte_reg_output",
                "evd_phase2_topline"
              ],
              "assumptionIds": [
                "asm_arms_converge"
              ],
              "contradictingEvidenceIds": [],
              "createdByParticipantId": "par_cmo",
              "createdAt": "2026-06-29T09:00:02.486Z"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:0bbdbf09af8d97b126c7ee112a7eb935c5f74910ce441ef0913b7d866f1a7409",
          "content_hash": "sha256:49b1786edd81a1aa5441b1a52648e829ca49798fb4eb7f29e440ed416c36ba36"
        },
        {
          "event_id": "evt_positiontaken_par_cmo_mqyzlqoa_74726b36",
          "event_type": "PositionTaken",
          "thread_id": "thd_phase2_to_phase3_go_nogo_ltn4481",
          "actor_id": "par_cmo",
          "timestamp": "2026-06-29T09:00:02.508Z",
          "payload": {
            "position": {
              "id": "pos_cmo_support",
              "object": "position",
              "threadId": "thd_phase2_to_phase3_go_nogo_ltn4481",
              "participantId": "par_cmo",
              "targetObjectId": "clm_go_supported",
              "targetObjectType": "claim",
              "stance": "support",
              "reason": "Arms converge. Conditions from each arm are incorporated as binding.",
              "takenAt": "2026-06-29T09:00:02.530Z"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:49b1786edd81a1aa5441b1a52648e829ca49798fb4eb7f29e440ed416c36ba36",
          "content_hash": "sha256:9508d0ab99a7ebc3efcdee865aa19458961b52a5e9e61a141afe1aa07da12052"
        },
        {
          "event_id": "evt_positiontaken_par_biostat_mqyzlqow_acd6b374",
          "event_type": "PositionTaken",
          "thread_id": "thd_phase2_to_phase3_go_nogo_ltn4481",
          "actor_id": "par_biostat",
          "timestamp": "2026-06-29T09:00:02.552Z",
          "payload": {
            "position": {
              "id": "pos_biostat_support",
              "object": "position",
              "threadId": "thd_phase2_to_phase3_go_nogo_ltn4481",
              "participantId": "par_biostat",
              "targetObjectId": "clm_go_supported",
              "targetObjectType": "claim",
              "stance": "support",
              "reason": "Go decision is supported. Subgroup discipline conditions are non-negotiable.",
              "takenAt": "2026-06-29T09:00:02.574Z"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:9508d0ab99a7ebc3efcdee865aa19458961b52a5e9e61a141afe1aa07da12052",
          "content_hash": "sha256:2857ec9e36d4bb6b423d1c916cb081a0e6eeb697f7126e0a5cd97cc59064e9ec"
        },
        {
          "event_id": "evt_positiontaken_par_clin_pharm_mqyzlqpi_beedb8bb",
          "event_type": "PositionTaken",
          "thread_id": "thd_phase2_to_phase3_go_nogo_ltn4481",
          "actor_id": "par_clin_pharm",
          "timestamp": "2026-06-29T09:00:02.596Z",
          "payload": {
            "position": {
              "id": "pos_clin_pharm_support",
              "object": "position",
              "threadId": "thd_phase2_to_phase3_go_nogo_ltn4481",
              "participantId": "par_clin_pharm",
              "targetObjectId": "clm_go_supported",
              "targetObjectType": "claim",
              "stance": "support",
              "reason": "Dose is confirmed. PK monitoring conditions protect against model failure.",
              "takenAt": "2026-06-29T09:00:02.618Z"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:2857ec9e36d4bb6b423d1c916cb081a0e6eeb697f7126e0a5cd97cc59064e9ec",
          "content_hash": "sha256:e978a7c8aee3a96700c642eb1ced26dc1c24bde3fea4c144cef71d9246a4a6f2"
        },
        {
          "event_id": "evt_positiontaken_par_safety_officer_mqyzlqq4_7f65cdbd",
          "event_type": "PositionTaken",
          "thread_id": "thd_phase2_to_phase3_go_nogo_ltn4481",
          "actor_id": "par_safety_officer",
          "timestamp": "2026-06-29T09:00:02.640Z",
          "payload": {
            "position": {
              "id": "pos_safety_officer_support",
              "object": "position",
              "threadId": "thd_phase2_to_phase3_go_nogo_ltn4481",
              "participantId": "par_safety_officer",
              "targetObjectId": "clm_go_supported",
              "targetObjectType": "claim",
              "stance": "support",
              "reason": "Safety is acceptable with conditions. Stopping rules are the critical path.",
              "takenAt": "2026-06-29T09:00:02.662Z"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:e978a7c8aee3a96700c642eb1ced26dc1c24bde3fea4c144cef71d9246a4a6f2",
          "content_hash": "sha256:c424f2e80e7040ee20ee81db536d19cc11fc2a6754afdce953909663371db602"
        },
        {
          "event_id": "evt_positiontaken_par_reg_affairs_mqyzlqqq_ca78627b",
          "event_type": "PositionTaken",
          "thread_id": "thd_phase2_to_phase3_go_nogo_ltn4481",
          "actor_id": "par_reg_affairs",
          "timestamp": "2026-06-29T09:00:02.684Z",
          "payload": {
            "position": {
              "id": "pos_reg_affairs_support",
              "object": "position",
              "threadId": "thd_phase2_to_phase3_go_nogo_ltn4481",
              "participantId": "par_reg_affairs",
              "targetObjectId": "clm_go_supported",
              "targetObjectType": "claim",
              "stance": "support",
              "reason": "Regulatory path is clear with FDA alignment.",
              "takenAt": "2026-06-29T09:00:02.706Z"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:c424f2e80e7040ee20ee81db536d19cc11fc2a6754afdce953909663371db602",
          "content_hash": "sha256:1be19ca62f2e1ba0e8f265c751a8345114708d252b9304f2bb0024ddb679ee9d"
        },
        {
          "event_id": "evt_positiontaken_par_dsmb_chair_mqyzlqrc_7dbbfb71",
          "event_type": "PositionTaken",
          "thread_id": "thd_phase2_to_phase3_go_nogo_ltn4481",
          "actor_id": "par_dsmb_chair",
          "timestamp": "2026-06-29T09:00:02.728Z",
          "payload": {
            "position": {
              "id": "pos_dsmb_chair_oppose",
              "object": "position",
              "threadId": "thd_phase2_to_phase3_go_nogo_ltn4481",
              "participantId": "par_dsmb_chair",
              "targetObjectId": "clm_go_supported",
              "targetObjectType": "claim",
              "stance": "oppose",
              "reason": "Not opposed to the science, but a single ~500-patient pivotal is too small a safety database to carry a known hepatic signal to a label. Advise delay for a larger exposed population or a second confirmatory study before committing.",
              "takenAt": "2026-06-29T09:00:02.750Z"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:1be19ca62f2e1ba0e8f265c751a8345114708d252b9304f2bb0024ddb679ee9d",
          "content_hash": "sha256:e5dd05c71288ad19b6ed5f21d36abc314d3abac001dddbdc539053e479f4c56a"
        },
        {
          "event_id": "evt_objectionraised_advancement_premature_mqyzlqry_893b171f",
          "event_type": "ObjectionRaised",
          "thread_id": "thd_phase2_to_phase3_go_nogo_ltn4481",
          "actor_id": "par_dsmb_chair",
          "timestamp": "2026-06-29T09:00:02.772Z",
          "payload": {
            "objection": {
              "id": "obj_advancement_premature",
              "object": "objection",
              "threadId": "thd_phase2_to_phase3_go_nogo_ltn4481",
              "participantId": "par_dsmb_chair",
              "targetObjectId": "clm_go_supported",
              "targetObjectType": "claim",
              "assumption": "A single ~500-patient pivotal provides an adequate labeling safety database for a drug with a known hepatotoxicity signal.",
              "text": "The advancement decision itself is premature as scoped. A single ~500-patient pivotal doubles as the labeling safety database, but ICH E1 expects on the order of 1000-1500 exposed for a chronic, non-life-threatening indication — more so with an active hepatic signal. Recommend either an enlarged safety database or a second confirmatory study before committing to Phase III, rather than advancing on a single pivotal. Recorded as a dissent on the go decision, not merely on its conditions.",
              "status": "open",
              "raisedAt": "2026-06-29T09:00:02.794Z"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:e5dd05c71288ad19b6ed5f21d36abc314d3abac001dddbdc539053e479f4c56a",
          "content_hash": "sha256:fc2acc1f60935da5c9270f7da182ba54615e2e5e2a23dd287d44c0008e155776"
        },
        {
          "event_id": "evt_objectionraised_propagated_stopping_mqyzlqsk_4ccee63b",
          "event_type": "ObjectionRaised",
          "thread_id": "thd_phase2_to_phase3_go_nogo_ltn4481",
          "actor_id": "par_safety_officer",
          "timestamp": "2026-06-29T09:00:02.816Z",
          "payload": {
            "objection": {
              "id": "obj_stopping_rules_propagated",
              "object": "objection",
              "threadId": "thd_phase2_to_phase3_go_nogo_ltn4481",
              "participantId": "par_safety_officer",
              "targetObjectId": "clm_go_supported",
              "targetObjectType": "claim",
              "assumption": "Arm-level safety conditions will be enforced in the parent decision.",
              "text": "Propagated from safety arm (thd_arm_safety_assessment_ltn4481): hepatic stopping rules must be finalized before first patient dosed. This is a hard gate, not a timeline target. If organizational pressure accelerates enrollment before stopping rules are complete, this decision record documents the safety officer identified it as a non-negotiable precondition.",
              "status": "open",
              "raisedAt": "2026-06-29T09:00:02.838Z"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:fc2acc1f60935da5c9270f7da182ba54615e2e5e2a23dd287d44c0008e155776",
          "content_hash": "sha256:665a1b9c917530f3e88808351528b9e85343f073aba37cbc43d081266e9804fd"
        },
        {
          "event_id": "evt_objectionraised_propagated_subgroup_mqyzlqt6_b1644704",
          "event_type": "ObjectionRaised",
          "thread_id": "thd_phase2_to_phase3_go_nogo_ltn4481",
          "actor_id": "par_biostat",
          "timestamp": "2026-06-29T09:00:02.860Z",
          "payload": {
            "objection": {
              "id": "obj_subgroup_discipline_propagated",
              "object": "objection",
              "threadId": "thd_phase2_to_phase3_go_nogo_ltn4481",
              "participantId": "par_biostat",
              "targetObjectId": "clm_go_supported",
              "targetObjectType": "claim",
              "assumption": "The exploratory-only designation for the bio-failure subgroup will hold against organizational pressure.",
              "text": "Propagated from subgroup arm (thd_arm_subgroup_review_ltn4481): any future protocol amendment promoting the bio-failure subgroup from exploratory to confirmatory was flagged as a statistical integrity risk. This objection is recorded at the go/no-go level to ensure the escalation path is documented.",
              "status": "open",
              "raisedAt": "2026-06-29T09:00:02.882Z"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:665a1b9c917530f3e88808351528b9e85343f073aba37cbc43d081266e9804fd",
          "content_hash": "sha256:07665d189eabd5f90eaff54a478299d4ea5c95f7e906d25b77debd373afa296c"
        },
        {
          "event_id": "evt_decisionrequestopened_drq_go_nogo_ltn4481_mqyzlqts_060824e7",
          "event_type": "DecisionRequestOpened",
          "thread_id": "thd_phase2_to_phase3_go_nogo_ltn4481",
          "actor_id": "par_cmo",
          "timestamp": "2026-06-29T09:00:02.904Z",
          "payload": {
            "decisionRequest": {
              "id": "drq_go_nogo_ltn4481",
              "object": "decisionRequest",
              "threadId": "thd_phase2_to_phase3_go_nogo_ltn4481",
              "proposal": "Advance LTN-4481 to Phase III with all arm-level conditions incorporated as binding.",
              "status": "review",
              "supportingEvidenceIds": [
                "cte_pkpd_output",
                "cte_safety_output",
                "cte_safety_objection",
                "cte_subgroup_output",
                "cte_subgroup_minority",
                "cte_reg_output",
                "evd_phase2_topline"
              ],
              "supportingClaimIds": [
                "clm_go_supported"
              ],
              "supportingAssumptionIds": [
                "asm_arms_converge"
              ],
              "objectionIds": [
                "obj_stopping_rules_propagated",
                "obj_subgroup_discipline_propagated",
                "obj_advancement_premature"
              ],
              "openedByParticipantId": "par_cmo",
              "openedAt": "2026-06-29T09:00:02.926Z"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:07665d189eabd5f90eaff54a478299d4ea5c95f7e906d25b77debd373afa296c",
          "content_hash": "sha256:592e240dc2fa63776ba4def6dffaded41c53dfa0727a5850770c04f3e8ddfe04"
        },
        {
          "event_id": "evt_reviewsubmitted_rev_biostat_parent_mqyzlque_fe1d9581",
          "event_type": "ReviewSubmitted",
          "thread_id": "thd_phase2_to_phase3_go_nogo_ltn4481",
          "actor_id": "par_biostat",
          "timestamp": "2026-06-29T09:00:02.948Z",
          "payload": {
            "review": {
              "id": "rev_biostat_parent",
              "object": "review",
              "threadId": "thd_phase2_to_phase3_go_nogo_ltn4481",
              "decisionRequestId": "drq_go_nogo_ltn4481",
              "reviewerParticipantId": "par_biostat",
              "status": "approve_with_conditions",
              "conditions": [
                "Subgroup exploratory-only designation is binding",
                "Enrollment capped at 60 percent before interim futility"
              ],
              "comment": "Go decision supported. Subgroup conditions from arm thread must be enforced.",
              "reviewedAt": "2026-06-29T09:00:02.970Z"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:592e240dc2fa63776ba4def6dffaded41c53dfa0727a5850770c04f3e8ddfe04",
          "content_hash": "sha256:0c0bee6bb459ddda82467699465b125494987de99e7c3fd34cbcd92bd432ebf1"
        },
        {
          "event_id": "evt_reviewsubmitted_rev_safety_parent_mqyzlqv0_bc2aef69",
          "event_type": "ReviewSubmitted",
          "thread_id": "thd_phase2_to_phase3_go_nogo_ltn4481",
          "actor_id": "par_safety_officer",
          "timestamp": "2026-06-29T09:00:02.992Z",
          "payload": {
            "review": {
              "id": "rev_safety_parent",
              "object": "review",
              "threadId": "thd_phase2_to_phase3_go_nogo_ltn4481",
              "decisionRequestId": "drq_go_nogo_ltn4481",
              "reviewerParticipantId": "par_safety_officer",
              "status": "approve_with_conditions",
              "conditions": [
                "Hepatic stopping rules before FPD — hard gate",
                "DSMB charter includes hepatotoxicity review authority"
              ],
              "comment": "Safety conditions from arm thread propagate as binding conditions.",
              "reviewedAt": "2026-06-29T09:00:03.014Z"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:0c0bee6bb459ddda82467699465b125494987de99e7c3fd34cbcd92bd432ebf1",
          "content_hash": "sha256:8234a732177b34ec0f1bb7bde136db58c9faec51316b678201259ac94c7303c6"
        },
        {
          "event_id": "evt_reviewsubmitted_rev_reg_parent_mqyzlqvm_68643adb",
          "event_type": "ReviewSubmitted",
          "thread_id": "thd_phase2_to_phase3_go_nogo_ltn4481",
          "actor_id": "par_reg_affairs",
          "timestamp": "2026-06-29T09:00:03.036Z",
          "payload": {
            "review": {
              "id": "rev_reg_parent",
              "object": "review",
              "threadId": "thd_phase2_to_phase3_go_nogo_ltn4481",
              "decisionRequestId": "drq_go_nogo_ltn4481",
              "reviewerParticipantId": "par_reg_affairs",
              "status": "approve_with_conditions",
              "conditions": [
                "IND amendment incorporates all arm-level conditions",
                "FDA Type B agreements referenced in protocol"
              ],
              "comment": "Regulatory path clear. All conditions must appear in IND amendment.",
              "reviewedAt": "2026-06-29T09:00:03.058Z"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:8234a732177b34ec0f1bb7bde136db58c9faec51316b678201259ac94c7303c6",
          "content_hash": "sha256:864c32bc339905c456687511a06ebd5477e2f1e78de84e877d031872befa3189"
        },
        {
          "event_id": "evt_decisionmerged_dcr_go_nogo_ltn4481_mqyzlqw8_bff824e6",
          "event_type": "DecisionMerged",
          "thread_id": "thd_phase2_to_phase3_go_nogo_ltn4481",
          "actor_id": "par_cmo",
          "timestamp": "2026-06-29T09:00:03.080Z",
          "payload": {
            "decisionRecord": {
              "id": "dcr_go_nogo_ltn4481",
              "object": "decisionRecord",
              "threadId": "thd_phase2_to_phase3_go_nogo_ltn4481",
              "decisionRequestId": "drq_go_nogo_ltn4481",
              "status": "approved",
              "summary": "LTN-4481 advances to Phase III. Single pivotal trial, 200mg Q4W, adaptive design. All arm-level conditions are binding. Scope narrower than requested: subgroup exploratory only, enrollment capped pre-interim, stopping rules before FPD.",
              "rationale": "Four arm-level workstreams converge: dose confirmed (PK/PD), safety acceptable with mitigation (safety assessment), subgroup disciplined to exploratory (subgroup review), regulatory path clear (regulatory strategy). Two objections propagate from arms and survive the parent decision: stopping rules hard gate and subgroup discipline. A third, distinct dissent — the independent DSMB chair's objection that a single ~500-patient pivotal is an inadequate labeling safety database for a known hepatic signal — is on the go decision itself; the CMO acknowledges it, elects to advance on the FDA-aligned single-pivotal path, and preserves the dissent rather than resolving it. The CMO accepts residual risk on PK/PD model generalization, mitigated by in-stream sampling.",
              "conditions": [
                "Hepatic stopping rules finalized before first patient dosed — hard gate (propagated from safety arm)",
                "DSMB charter includes hepatotoxicity review authority (propagated from safety arm)",
                "Baseline ALT greater than 2x ULN exclusion (propagated from safety arm)",
                "Biweekly ALT/AST monitoring for first 12 weeks (propagated from safety arm)",
                "Bio-failure subgroup exploratory only — no alpha, no enrichment, no stratification (propagated from subgroup arm)",
                "Enrollment capped at 60 percent before interim futility readout",
                "Binding futility boundary at conditional power below 20 percent",
                "PK sampling at weeks 4 and 12 — dose adjustment if exposure deviates more than 30 percent (propagated from PK/PD arm)",
                "IND amendment references FDA Type B meeting agreements (propagated from regulatory arm)"
              ],
              "supportingEvidenceIds": [
                "cte_pkpd_output",
                "cte_safety_output",
                "cte_safety_objection",
                "cte_subgroup_output",
                "cte_subgroup_minority",
                "cte_reg_output",
                "evd_phase2_topline"
              ],
              "supportingClaimIds": [
                "clm_go_supported"
              ],
              "supportingAssumptionIds": [
                "asm_arms_converge"
              ],
              "objectionIds": [
                "obj_stopping_rules_propagated",
                "obj_subgroup_discipline_propagated",
                "obj_advancement_premature"
              ],
              "reviewIds": [
                "rev_biostat_parent",
                "rev_safety_parent",
                "rev_reg_parent"
              ],
              "authorityTrail": [
                {
                  "participantId": "par_cmo",
                  "role": "decision owner",
                  "source": "ParticipantAdded.role"
                }
              ],
              "preservedObjectionIds": [
                "obj_stopping_rules_propagated",
                "obj_subgroup_discipline_propagated",
                "obj_advancement_premature"
              ],
              "minorityReportIds": [
                "mnr_parent_biostat_discipline",
                "mnr_parent_advancement_dissent"
              ],
              "nextAction": "Protocol team finalizes Phase III protocol incorporating all nine conditions from the four arm threads. Stopping rules and DSMB charter are critical path. Target IND amendment: 8 weeks.",
              "decidedByParticipantId": "par_cmo",
              "decidedAt": "2026-06-29T09:00:03.102Z",
              "contentHash": "sha256:arm_dcr_go_nogo_ltn4481"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:864c32bc339905c456687511a06ebd5477e2f1e78de84e877d031872befa3189",
          "content_hash": "sha256:db1c2ab93c5ee5255d8c6cd81efa51473919610c67e2be78d36051e13af35c3c"
        },
        {
          "event_id": "evt_minorityreportfiled_parent_dissent_mqyzlqwu_1a89773c",
          "event_type": "MinorityReportFiled",
          "thread_id": "thd_phase2_to_phase3_go_nogo_ltn4481",
          "actor_id": "par_biostat",
          "timestamp": "2026-06-29T09:00:03.124Z",
          "payload": {
            "minorityReport": {
              "id": "mnr_parent_biostat_discipline",
              "object": "minorityReport",
              "threadId": "thd_phase2_to_phase3_go_nogo_ltn4481",
              "decisionRecordId": "dcr_go_nogo_ltn4481",
              "participantId": "par_biostat",
              "text": "This minority report propagates and reinforces the arm-level dissent from thd_arm_subgroup_review_ltn4481. At the go/no-go level, the risk is compounded: now that the program has a green light to Phase III, the commercial and timeline pressures to incorporate the bio-failure subgroup finding into the design will intensify. This report documents that the lead biostatistician objects to any protocol amendment that promotes the subgroup from exploratory to confirmatory, and that the stopping-rules hard gate from the safety arm must not be softened under enrollment pressure. Both objections survive the approval and are traceable through cross-thread provenance to the arm-level decisions that originated them.",
              "objectionIds": [
                "obj_stopping_rules_propagated",
                "obj_subgroup_discipline_propagated"
              ],
              "filedAt": "2026-06-29T09:00:03.146Z",
              "contentHash": "sha256:mnr_parent_biostat_discipline"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:db1c2ab93c5ee5255d8c6cd81efa51473919610c67e2be78d36051e13af35c3c",
          "content_hash": "sha256:73975cfa8e0f048efe6d5de110b5a079d680c79371d1c07ad257908c24fb8e41"
        },
        {
          "event_id": "evt_minorityreportfiled_advancement_dissent_mqyzlqxg_a910192c",
          "event_type": "MinorityReportFiled",
          "thread_id": "thd_phase2_to_phase3_go_nogo_ltn4481",
          "actor_id": "par_dsmb_chair",
          "timestamp": "2026-06-29T09:00:03.168Z",
          "payload": {
            "minorityReport": {
              "id": "mnr_parent_advancement_dissent",
              "object": "minorityReport",
              "threadId": "thd_phase2_to_phase3_go_nogo_ltn4481",
              "decisionRecordId": "dcr_go_nogo_ltn4481",
              "participantId": "par_dsmb_chair",
              "text": "The independent DSMB chair dissents from the advancement decision as scoped. The program is advancing to Phase III on a single ~500-patient pivotal that will also serve as the labeling safety database for a drug with two serious transaminase elevations in Phase II. ICH E1 expects roughly 1000-1500 exposed for a chronic, non-life-threatening indication, and a live hepatic signal argues for more, not fewer. This report records that the chair recommended an enlarged safety database or a second confirmatory study before committing, that the decision proceeded on the FDA-aligned single-pivotal path notwithstanding, and that this dissent is on whether to advance — not merely on the conditions of advancement.",
              "objectionIds": [
                "obj_advancement_premature"
              ],
              "filedAt": "2026-06-29T09:00:03.190Z",
              "contentHash": "sha256:mnr_parent_advancement_dissent"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:73975cfa8e0f048efe6d5de110b5a079d680c79371d1c07ad257908c24fb8e41",
          "content_hash": "sha256:34450313f887036000acc55831648f69e214f5e912874fc27e40f18c2c6d0571"
        }
      ]
    },
    {
      "role": "arm",
      "threadId": "thd_arm_pkpd_modeling_ltn4481",
      "events": [
        {
          "event_id": "evt_participantadded_par_clin_pharm_mqyzlpc0_f0d642c8",
          "event_type": "ParticipantAdded",
          "thread_id": "thd_arm_pkpd_modeling_ltn4481",
          "actor_id": "par_clin_pharm",
          "timestamp": "2026-06-29T09:00:00.000Z",
          "payload": {
            "participant": {
              "id": "par_clin_pharm",
              "object": "participant",
              "kind": "human",
              "name": "Dr. A. Osei",
              "role": "decision owner"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "content_hash": "sha256:8588be71735226503ef1ff5eb22e39408525c52c2b78b172ab68192cdeba5e15"
        },
        {
          "event_id": "evt_participantadded_par_pk_modeler_mqyzlpcm_9af1f5fd",
          "event_type": "ParticipantAdded",
          "thread_id": "thd_arm_pkpd_modeling_ltn4481",
          "actor_id": "par_pk_modeler",
          "timestamp": "2026-06-29T09:00:00.022Z",
          "payload": {
            "participant": {
              "id": "par_pk_modeler",
              "object": "participant",
              "kind": "human",
              "name": "Dr. F. Chen",
              "role": "pk modeling scientist"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:8588be71735226503ef1ff5eb22e39408525c52c2b78b172ab68192cdeba5e15",
          "content_hash": "sha256:cb401c06b8b1928ff1d0ad3e4621dcf4718fa831ad5188edabb9a5ec76736032"
        },
        {
          "event_id": "evt_threadcreated_thd_arm_pkpd_modeling_ltn4481_mqyzlpd8_48f9db72",
          "event_type": "ThreadCreated",
          "thread_id": "thd_arm_pkpd_modeling_ltn4481",
          "actor_id": "par_clin_pharm",
          "timestamp": "2026-06-29T09:00:00.044Z",
          "payload": {
            "thread": {
              "id": "thd_arm_pkpd_modeling_ltn4481",
              "object": "thread",
              "title": "PK/PD Modeling — LTN-4481 Dose Confirmation",
              "question": "Is the 200mg Q4W dose supported by exposure-response data for Phase III?",
              "status": "active",
              "participantIds": [
                "par_clin_pharm",
                "par_pk_modeler"
              ],
              "createdAt": "2026-06-29T09:00:00.000Z",
              "updatedAt": "2026-06-29T09:00:00.000Z"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:cb401c06b8b1928ff1d0ad3e4621dcf4718fa831ad5188edabb9a5ec76736032",
          "content_hash": "sha256:de7995c87595e0d790188740f1519ab4b99acbd0c5eab6a85f51a36801a79a71"
        },
        {
          "event_id": "evt_evidencecommitted_evd_pkpd_pop_model_mqyzlpdu_d3028a72",
          "event_type": "EvidenceCommitted",
          "thread_id": "thd_arm_pkpd_modeling_ltn4481",
          "actor_id": "par_pk_modeler",
          "timestamp": "2026-06-29T09:00:00.066Z",
          "payload": {
            "evidence": {
              "id": "evd_pkpd_pop_model",
              "object": "evidence",
              "threadId": "thd_arm_pkpd_modeling_ltn4481",
              "source": "Population PK/PD analysis (4481-PK-002)",
              "finding": "Exposure-response modeling on Phase II data (N=347). Cmin at steady state correlates with endoscopic improvement (R-squared 0.71). 200mg Q4W predicts 85 percent of patients achieve target exposure.",
              "confidence": 0.84,
              "committedByParticipantId": "par_pk_modeler",
              "committedAt": "2026-06-29T09:00:00.066Z",
              "artifactIds": [],
              "contentHash": "sha256:arm_evd_pkpd_pop_model"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:de7995c87595e0d790188740f1519ab4b99acbd0c5eab6a85f51a36801a79a71",
          "content_hash": "sha256:4861bdf270cdd3d5663557eff39302d0dc74e83c5aeda706df38914e63c8ccc1"
        },
        {
          "event_id": "evt_evidencecommitted_evd_pkpd_internal_validation_mqyzlpeg_511bd8bd",
          "event_type": "EvidenceCommitted",
          "thread_id": "thd_arm_pkpd_modeling_ltn4481",
          "actor_id": "par_pk_modeler",
          "timestamp": "2026-06-29T09:00:00.088Z",
          "payload": {
            "evidence": {
              "id": "evd_pkpd_internal_validation",
              "object": "evidence",
              "threadId": "thd_arm_pkpd_modeling_ltn4481",
              "source": "Internal model validation (bootstrap, VPC)",
              "finding": "1000-replicate bootstrap shows parameter stability. Visual predictive check covers 90 percent of observed data within prediction interval. No external dataset available for external validation.",
              "confidence": 0.79,
              "committedByParticipantId": "par_pk_modeler",
              "committedAt": "2026-06-29T09:00:00.088Z",
              "artifactIds": [],
              "contentHash": "sha256:arm_evd_pkpd_internal_validation"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:4861bdf270cdd3d5663557eff39302d0dc74e83c5aeda706df38914e63c8ccc1",
          "content_hash": "sha256:ff6ae4ea32f890aaa20faf253efdbfa95ab01bc26c046b9194c097dc5871113c"
        },
        {
          "event_id": "evt_evidencecommitted_evd_dose_response_phase2_mqyzlpf2_ed045dd8",
          "event_type": "EvidenceCommitted",
          "thread_id": "thd_arm_pkpd_modeling_ltn4481",
          "actor_id": "par_clin_pharm",
          "timestamp": "2026-06-29T09:00:00.110Z",
          "payload": {
            "evidence": {
              "id": "evd_dose_response_phase2",
              "object": "evidence",
              "threadId": "thd_arm_pkpd_modeling_ltn4481",
              "source": "Phase II dose-response (100mg vs 200mg vs placebo)",
              "finding": "Clear dose-response: placebo 12.1 percent, 100mg 24.7 percent, 200mg 38.2 percent remission. Exposure-response is monotonic and still rising at 200mg — the top of the dose-response was not characterized above 200mg (only two active levels tested).",
              "confidence": 0.91,
              "committedByParticipantId": "par_clin_pharm",
              "committedAt": "2026-06-29T09:00:00.110Z",
              "artifactIds": [],
              "contentHash": "sha256:arm_evd_dose_response_phase2"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:ff6ae4ea32f890aaa20faf253efdbfa95ab01bc26c046b9194c097dc5871113c",
          "content_hash": "sha256:0947288beaceb5ade30e922d0334c44264264cf956ae74a103ba18477dd0381e"
        },
        {
          "event_id": "evt_evidencecommitted_evd_hepatic_exposure_response_mqyzlpfo_c078f851",
          "event_type": "EvidenceCommitted",
          "thread_id": "thd_arm_pkpd_modeling_ltn4481",
          "actor_id": "par_pk_modeler",
          "timestamp": "2026-06-29T09:00:00.132Z",
          "payload": {
            "evidence": {
              "id": "evd_hepatic_exposure_response",
              "object": "evidence",
              "threadId": "thd_arm_pkpd_modeling_ltn4481",
              "source": "Hepatic safety exposure-response check (4481-PK-005)",
              "finding": "Both serious transaminase elevations occurred at 200mg, but with two active dose levels and n=2 events no exposure-response for hepatotoxicity could be established. Dose selection therefore rests on the efficacy exposure-response; the hepatic signal is managed by monitoring and stopping rules, not by dose reduction.",
              "confidence": 0.61,
              "committedByParticipantId": "par_pk_modeler",
              "committedAt": "2026-06-29T09:00:00.132Z",
              "artifactIds": [],
              "contentHash": "sha256:arm_evd_hepatic_exposure_response"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:0947288beaceb5ade30e922d0334c44264264cf956ae74a103ba18477dd0381e",
          "content_hash": "sha256:cbd7efd41ee784afb42ee47514532b5294fdc797b0226c95aa476404ff18b008"
        },
        {
          "event_id": "evt_assumptiondeclared_asm_pkpd_model_generalizes_mqyzlpga_3fe5d61c",
          "event_type": "AssumptionDeclared",
          "thread_id": "thd_arm_pkpd_modeling_ltn4481",
          "actor_id": "par_clin_pharm",
          "timestamp": "2026-06-29T09:00:00.154Z",
          "payload": {
            "assumption": {
              "id": "asm_pkpd_model_generalizes",
              "object": "assumption",
              "threadId": "thd_arm_pkpd_modeling_ltn4481",
              "text": "The PK/PD model developed on Phase II data will generalize to the larger, more heterogeneous Phase III population without external validation.",
              "status": "active",
              "evidenceIds": [
                "evd_pkpd_internal_validation"
              ],
              "confidence": 0.69,
              "declaredByParticipantId": "par_clin_pharm",
              "declaredAt": "2026-06-29T09:00:00.154Z",
              "contentHash": "sha256:arm_asm_pkpd_model_generalizes"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:cbd7efd41ee784afb42ee47514532b5294fdc797b0226c95aa476404ff18b008",
          "content_hash": "sha256:daf5905f0035ce3a0a9051af1369084d0f5b80c3352007daeb47ab6323f6f1be"
        },
        {
          "event_id": "evt_assumptiondeclared_asm_no_hepatic_exposure_response_mqyzlpgw_a4a492ad",
          "event_type": "AssumptionDeclared",
          "thread_id": "thd_arm_pkpd_modeling_ltn4481",
          "actor_id": "par_clin_pharm",
          "timestamp": "2026-06-29T09:00:00.176Z",
          "payload": {
            "assumption": {
              "id": "asm_no_hepatic_exposure_response",
              "object": "assumption",
              "threadId": "thd_arm_pkpd_modeling_ltn4481",
              "text": "No dose-safety exposure-response was established for the hepatic signal; the 200mg selection is efficacy-driven, and dose is not being used as a lever to manage hepatotoxicity.",
              "status": "active",
              "evidenceIds": [
                "evd_hepatic_exposure_response"
              ],
              "confidence": 0.6,
              "declaredByParticipantId": "par_clin_pharm",
              "declaredAt": "2026-06-29T09:00:00.176Z",
              "contentHash": "sha256:arm_asm_no_hepatic_exposure_response"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:daf5905f0035ce3a0a9051af1369084d0f5b80c3352007daeb47ab6323f6f1be",
          "content_hash": "sha256:78a9b9d485a19e1ff20c9164969750bd4581260bd5de4655bc3c5f3683789794"
        },
        {
          "event_id": "evt_claimcreated_clm_dose_confirmed_mqyzlphi_7fa708cd",
          "event_type": "ClaimCreated",
          "thread_id": "thd_arm_pkpd_modeling_ltn4481",
          "actor_id": "par_clin_pharm",
          "timestamp": "2026-06-29T09:00:00.198Z",
          "payload": {
            "claim": {
              "id": "clm_dose_confirmed",
              "object": "claim",
              "threadId": "thd_arm_pkpd_modeling_ltn4481",
              "text": "200mg Q4W is the confirmed Phase III maintenance dose (with a defined induction regimen through week 12) based on the efficacy exposure-response and FDA alignment; safety is managed by monitoring rather than a dose-safety relationship.",
              "status": "endorsed",
              "evidenceIds": [
                "evd_pkpd_pop_model",
                "evd_dose_response_phase2"
              ],
              "assumptionIds": [
                "asm_pkpd_model_generalizes",
                "asm_no_hepatic_exposure_response"
              ],
              "contradictingEvidenceIds": [],
              "createdByParticipantId": "par_clin_pharm",
              "createdAt": "2026-06-29T09:00:00.220Z"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:78a9b9d485a19e1ff20c9164969750bd4581260bd5de4655bc3c5f3683789794",
          "content_hash": "sha256:bcdcb6be343bfd1d3f6352294265a72bfda17dd8c119c69d7d7ba9a37b9d33c7"
        },
        {
          "event_id": "evt_positiontaken_par_pk_modeler_mqyzlpi4_eb5c69ae",
          "event_type": "PositionTaken",
          "thread_id": "thd_arm_pkpd_modeling_ltn4481",
          "actor_id": "par_pk_modeler",
          "timestamp": "2026-06-29T09:00:00.242Z",
          "payload": {
            "position": {
              "id": "pos_pk_modeler_support",
              "object": "position",
              "threadId": "thd_arm_pkpd_modeling_ltn4481",
              "participantId": "par_pk_modeler",
              "targetObjectId": "clm_dose_confirmed",
              "targetObjectType": "claim",
              "stance": "support",
              "reason": "Model supports 200mg. External validation gap is a monitoring item, not a blocker.",
              "takenAt": "2026-06-29T09:00:00.264Z"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:bcdcb6be343bfd1d3f6352294265a72bfda17dd8c119c69d7d7ba9a37b9d33c7",
          "content_hash": "sha256:a2dfe0060c32b2ed54f51ace1004845b9bdacd3e69e8105493fef3ef932a84af"
        },
        {
          "event_id": "evt_positiontaken_par_clin_pharm_mqyzlpiq_1c92c956",
          "event_type": "PositionTaken",
          "thread_id": "thd_arm_pkpd_modeling_ltn4481",
          "actor_id": "par_clin_pharm",
          "timestamp": "2026-06-29T09:00:00.286Z",
          "payload": {
            "position": {
              "id": "pos_clin_pharm_support",
              "object": "position",
              "threadId": "thd_arm_pkpd_modeling_ltn4481",
              "participantId": "par_clin_pharm",
              "targetObjectId": "clm_dose_confirmed",
              "targetObjectType": "claim",
              "stance": "support",
              "reason": "Dose-response is clear. Recommend protocol-specified PK sampling at weeks 4 and 12 for early model check.",
              "takenAt": "2026-06-29T09:00:00.308Z"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:a2dfe0060c32b2ed54f51ace1004845b9bdacd3e69e8105493fef3ef932a84af",
          "content_hash": "sha256:7001e3b29d2ab9db4250f3333be11da4dd079c20e4ae3f88d0cec43276947ded"
        },
        {
          "event_id": "evt_decisionrequestopened_drq_pkpd_dose_confirm_mqyzlpjc_e5042433",
          "event_type": "DecisionRequestOpened",
          "thread_id": "thd_arm_pkpd_modeling_ltn4481",
          "actor_id": "par_clin_pharm",
          "timestamp": "2026-06-29T09:00:00.330Z",
          "payload": {
            "decisionRequest": {
              "id": "drq_pkpd_dose_confirm",
              "object": "decisionRequest",
              "threadId": "thd_arm_pkpd_modeling_ltn4481",
              "proposal": "Confirm 200mg Q4W for Phase III with protocol-specified early PK sampling for model validation.",
              "status": "review",
              "supportingEvidenceIds": [
                "evd_pkpd_pop_model",
                "evd_pkpd_internal_validation",
                "evd_dose_response_phase2"
              ],
              "supportingClaimIds": [
                "clm_dose_confirmed"
              ],
              "supportingAssumptionIds": [
                "asm_pkpd_model_generalizes"
              ],
              "objectionIds": [],
              "openedByParticipantId": "par_clin_pharm",
              "openedAt": "2026-06-29T09:00:00.352Z"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:7001e3b29d2ab9db4250f3333be11da4dd079c20e4ae3f88d0cec43276947ded",
          "content_hash": "sha256:c6dc2c0617bbab4c540650298f5d6a915474a417e68b6f222b801b7ebad60e0e"
        },
        {
          "event_id": "evt_reviewsubmitted_rev_pk_modeler_mqyzlpjy_d8d1ae66",
          "event_type": "ReviewSubmitted",
          "thread_id": "thd_arm_pkpd_modeling_ltn4481",
          "actor_id": "par_pk_modeler",
          "timestamp": "2026-06-29T09:00:00.374Z",
          "payload": {
            "review": {
              "id": "rev_pk_modeler",
              "object": "review",
              "threadId": "thd_arm_pkpd_modeling_ltn4481",
              "decisionRequestId": "drq_pkpd_dose_confirm",
              "reviewerParticipantId": "par_pk_modeler",
              "status": "approve_with_conditions",
              "conditions": [
                "Protocol-specified PK sampling at weeks 4 and 12",
                "Dose adjustment pathway pre-specified if observed exposure deviates more than 30 percent from prediction"
              ],
              "comment": "Model supports the dose. Conditions protect against generalization failure.",
              "reviewedAt": "2026-06-29T09:00:00.396Z"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:c6dc2c0617bbab4c540650298f5d6a915474a417e68b6f222b801b7ebad60e0e",
          "content_hash": "sha256:d7d1f30866543ae78cae9882f652589018ad150bdb35cf5d7eb5bcddae2f2d88"
        },
        {
          "event_id": "evt_decisionmerged_dcr_pkpd_dose_confirmed_mqyzlpkk_9f70b872",
          "event_type": "DecisionMerged",
          "thread_id": "thd_arm_pkpd_modeling_ltn4481",
          "actor_id": "par_clin_pharm",
          "timestamp": "2026-06-29T09:00:00.418Z",
          "payload": {
            "decisionRecord": {
              "id": "dcr_pkpd_dose_confirmed",
              "object": "decisionRecord",
              "threadId": "thd_arm_pkpd_modeling_ltn4481",
              "decisionRequestId": "drq_pkpd_dose_confirm",
              "status": "approved",
              "summary": "200mg Q4W confirmed for Phase III. Early PK sampling and dose adjustment pathway required.",
              "rationale": "Exposure-response is monotonic and model-supported. External validation gap mitigated by in-stream PK checks.",
              "conditions": [
                "Protocol-specified PK sampling at weeks 4 and 12",
                "Dose adjustment pathway activates if observed exposure deviates more than 30 percent from model prediction"
              ],
              "supportingEvidenceIds": [
                "evd_pkpd_pop_model",
                "evd_pkpd_internal_validation",
                "evd_dose_response_phase2"
              ],
              "supportingClaimIds": [
                "clm_dose_confirmed"
              ],
              "supportingAssumptionIds": [
                "asm_pkpd_model_generalizes"
              ],
              "objectionIds": [],
              "reviewIds": [
                "rev_pk_modeler"
              ],
              "authorityTrail": [
                {
                  "participantId": "par_clin_pharm",
                  "role": "decision owner",
                  "source": "ParticipantAdded.role"
                }
              ],
              "preservedObjectionIds": [],
              "minorityReportIds": [],
              "nextAction": "Include PK sampling schedule and dose adjustment trigger in Phase III protocol.",
              "decidedByParticipantId": "par_clin_pharm",
              "decidedAt": "2026-06-29T09:00:00.440Z",
              "contentHash": "sha256:arm_dcr_pkpd_dose_confirmed"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:d7d1f30866543ae78cae9882f652589018ad150bdb35cf5d7eb5bcddae2f2d88",
          "content_hash": "sha256:d63ab532dae873091e72af85de8c4c9f83c12176a4f0705d3c2b60f4011af14f"
        }
      ]
    },
    {
      "role": "arm",
      "threadId": "thd_arm_safety_assessment_ltn4481",
      "events": [
        {
          "event_id": "evt_participantadded_par_safety_officer_mqyzlpl6_39cf4ce0",
          "event_type": "ParticipantAdded",
          "thread_id": "thd_arm_safety_assessment_ltn4481",
          "actor_id": "par_safety_officer",
          "timestamp": "2026-06-29T09:00:00.462Z",
          "payload": {
            "participant": {
              "id": "par_safety_officer",
              "object": "participant",
              "kind": "human",
              "name": "Dr. T. Nakamura",
              "role": "decision owner"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "content_hash": "sha256:f43dca42e1d978f1929e9962a35bf1107194c77d48dbb0abda45c447e9046f9e"
        },
        {
          "event_id": "evt_participantadded_par_dili_panel_mqyzlpls_174e5468",
          "event_type": "ParticipantAdded",
          "thread_id": "thd_arm_safety_assessment_ltn4481",
          "actor_id": "par_dili_panel",
          "timestamp": "2026-06-29T09:00:00.484Z",
          "payload": {
            "participant": {
              "id": "par_dili_panel",
              "object": "participant",
              "kind": "human",
              "name": "DILI Expert Panel",
              "role": "independent reviewer"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:f43dca42e1d978f1929e9962a35bf1107194c77d48dbb0abda45c447e9046f9e",
          "content_hash": "sha256:2f15a3d0dff01247c2ddfcbf636d7d80147992a26e9c23e7f85a594136dd2b22"
        },
        {
          "event_id": "evt_threadcreated_thd_arm_safety_assessment_ltn4481_mqyzlpme_7d637ed4",
          "event_type": "ThreadCreated",
          "thread_id": "thd_arm_safety_assessment_ltn4481",
          "actor_id": "par_safety_officer",
          "timestamp": "2026-06-29T09:00:00.506Z",
          "payload": {
            "thread": {
              "id": "thd_arm_safety_assessment_ltn4481",
              "object": "thread",
              "title": "Safety Signal Assessment — LTN-4481 Hepatotoxicity",
              "question": "Is the hepatotoxicity signal manageable for Phase III advancement?",
              "status": "active",
              "participantIds": [
                "par_safety_officer",
                "par_dili_panel"
              ],
              "createdAt": "2026-06-29T09:00:00.000Z",
              "updatedAt": "2026-06-29T09:00:00.000Z"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:2f15a3d0dff01247c2ddfcbf636d7d80147992a26e9c23e7f85a594136dd2b22",
          "content_hash": "sha256:c00ffa6759be8f1179473c574a5172081b7eeff5f36d1c1c97ea8fe3ea96ac6e"
        },
        {
          "event_id": "evt_evidencecommitted_evd_integrated_safety_mqyzlpn0_45aaf41c",
          "event_type": "EvidenceCommitted",
          "thread_id": "thd_arm_safety_assessment_ltn4481",
          "actor_id": "par_safety_officer",
          "timestamp": "2026-06-29T09:00:00.528Z",
          "payload": {
            "evidence": {
              "id": "evd_integrated_safety",
              "object": "evidence",
              "threadId": "thd_arm_safety_assessment_ltn4481",
              "source": "Integrated safety database (4481-ISS-001, N=612)",
              "finding": "SAE rate 6.8 percent vs 5.2 percent placebo. Two serious hepatotoxicity cases (ALT greater than 10x ULN) in 200mg arm; in both, total bilirubin remained below 2x ULN, so neither met Hy's Law criteria (isolated transaminase elevation, Temple's Corollary), and both resolved on discontinuation. No deaths. Infection rate 14.3 percent vs 11.7 percent placebo.",
              "confidence": 0.88,
              "committedByParticipantId": "par_safety_officer",
              "committedAt": "2026-06-29T09:00:00.528Z",
              "artifactIds": [],
              "contentHash": "sha256:arm_evd_integrated_safety"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:c00ffa6759be8f1179473c574a5172081b7eeff5f36d1c1c97ea8fe3ea96ac6e",
          "content_hash": "sha256:8628fa828c1a9a24714f6afa6de67f737a40c4f1eb5959e66f0f4af653384ac6"
        },
        {
          "event_id": "evt_evidencecommitted_evd_dili_panel_review_mqyzlpnm_824ba2d5",
          "event_type": "EvidenceCommitted",
          "thread_id": "thd_arm_safety_assessment_ltn4481",
          "actor_id": "par_dili_panel",
          "timestamp": "2026-06-29T09:00:00.550Z",
          "payload": {
            "evidence": {
              "id": "evd_dili_panel_review",
              "object": "evidence",
              "threadId": "thd_arm_safety_assessment_ltn4481",
              "source": "DILI expert panel assessment (4481-SA-003)",
              "finding": "Panel consensus: probable drug-related hepatotoxicity (RUCAM 'probable'). Baseline hepatic steatosis was considered and rejected as sole cause — steatosis does not produce ALT greater than 10x ULN. Recommends excluding baseline ALT greater than 2x ULN, biweekly liver monitoring for first 12 weeks, and protocol-defined Hy's Law stopping and rechallenge rules.",
              "confidence": 0.79,
              "committedByParticipantId": "par_dili_panel",
              "committedAt": "2026-06-29T09:00:00.550Z",
              "artifactIds": [],
              "contentHash": "sha256:arm_evd_dili_panel_review"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:8628fa828c1a9a24714f6afa6de67f737a40c4f1eb5959e66f0f4af653384ac6",
          "content_hash": "sha256:84a543910b0d988fc4d52b219327211fd05a172e5582f23f39799b36ac9022e5"
        },
        {
          "event_id": "evt_evidencecommitted_evd_class_context_mqyzlpo8_940d55ab",
          "event_type": "EvidenceCommitted",
          "thread_id": "thd_arm_safety_assessment_ltn4481",
          "actor_id": "par_safety_officer",
          "timestamp": "2026-06-29T09:00:00.572Z",
          "payload": {
            "evidence": {
              "id": "evd_class_context",
              "object": "evidence",
              "threadId": "thd_arm_safety_assessment_ltn4481",
              "source": "Hepatotoxicity class context (FDA safety communications 2024-2026)",
              "finding": "FDA has issued two safety-based label changes for UC drugs in the past 18 months related to hepatic signals. Heightened scrutiny expected.",
              "confidence": 0.86,
              "committedByParticipantId": "par_safety_officer",
              "committedAt": "2026-06-29T09:00:00.572Z",
              "artifactIds": [],
              "contentHash": "sha256:arm_evd_class_context"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:84a543910b0d988fc4d52b219327211fd05a172e5582f23f39799b36ac9022e5",
          "content_hash": "sha256:9bd187f809b0549fc44cc7e0212dfe91943505bd8a50a72c864a2c152719240f"
        },
        {
          "event_id": "evt_assumptiondeclared_asm_monitoring_sufficient_mqyzlpou_04485337",
          "event_type": "AssumptionDeclared",
          "thread_id": "thd_arm_safety_assessment_ltn4481",
          "actor_id": "par_safety_officer",
          "timestamp": "2026-06-29T09:00:00.594Z",
          "payload": {
            "assumption": {
              "id": "asm_monitoring_sufficient",
              "object": "assumption",
              "threadId": "thd_arm_safety_assessment_ltn4481",
              "text": "Enhanced monitoring (biweekly ALT/AST for 12 weeks) and exclusion criteria (baseline ALT greater than 2x ULN) are sufficient to manage the hepatotoxicity risk in Phase III.",
              "status": "active",
              "evidenceIds": [
                "evd_dili_panel_review",
                "evd_integrated_safety"
              ],
              "confidence": 0.76,
              "declaredByParticipantId": "par_safety_officer",
              "declaredAt": "2026-06-29T09:00:00.594Z",
              "contentHash": "sha256:arm_asm_monitoring_sufficient"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:9bd187f809b0549fc44cc7e0212dfe91943505bd8a50a72c864a2c152719240f",
          "content_hash": "sha256:95a8fe24655eee0f7048c9245197d5858f3ca8f955121c6991dbee6f03b5cb93"
        },
        {
          "event_id": "evt_claimcreated_clm_safety_manageable_mqyzlppg_c390b3d7",
          "event_type": "ClaimCreated",
          "thread_id": "thd_arm_safety_assessment_ltn4481",
          "actor_id": "par_safety_officer",
          "timestamp": "2026-06-29T09:00:00.616Z",
          "payload": {
            "claim": {
              "id": "clm_safety_manageable",
              "object": "claim",
              "threadId": "thd_arm_safety_assessment_ltn4481",
              "text": "Hepatotoxicity signal is manageable for Phase III with protocol-level mitigation per DILI panel recommendations.",
              "status": "endorsed",
              "evidenceIds": [
                "evd_integrated_safety",
                "evd_dili_panel_review"
              ],
              "assumptionIds": [
                "asm_monitoring_sufficient"
              ],
              "contradictingEvidenceIds": [],
              "createdByParticipantId": "par_safety_officer",
              "createdAt": "2026-06-29T09:00:00.638Z"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:95a8fe24655eee0f7048c9245197d5858f3ca8f955121c6991dbee6f03b5cb93",
          "content_hash": "sha256:944e74f21439f4ebaec2bbb8c7d76ec388a3b517c739cfd3dfe87da249a86d29"
        },
        {
          "event_id": "evt_positiontaken_par_dili_panel_mqyzlpq2_d2b708dd",
          "event_type": "PositionTaken",
          "thread_id": "thd_arm_safety_assessment_ltn4481",
          "actor_id": "par_dili_panel",
          "timestamp": "2026-06-29T09:00:00.660Z",
          "payload": {
            "position": {
              "id": "pos_dili_panel_support",
              "object": "position",
              "threadId": "thd_arm_safety_assessment_ltn4481",
              "participantId": "par_dili_panel",
              "targetObjectId": "clm_safety_manageable",
              "targetObjectType": "claim",
              "stance": "support",
              "reason": "Signal is concerning but pattern is consistent with known mechanism. Mitigation measures are standard for the class.",
              "takenAt": "2026-06-29T09:00:00.682Z"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:944e74f21439f4ebaec2bbb8c7d76ec388a3b517c739cfd3dfe87da249a86d29",
          "content_hash": "sha256:1b5798cdbf80e04b8ab1e98665b5ede2bddf8af6df3ff45eddc9d6c628ff2d14"
        },
        {
          "event_id": "evt_objectionraised_stopping_rules_mqyzlpqo_8e092359",
          "event_type": "ObjectionRaised",
          "thread_id": "thd_arm_safety_assessment_ltn4481",
          "actor_id": "par_safety_officer",
          "timestamp": "2026-06-29T09:00:00.704Z",
          "payload": {
            "objection": {
              "id": "obj_arm_stopping_rules",
              "object": "objection",
              "threadId": "thd_arm_safety_assessment_ltn4481",
              "participantId": "par_safety_officer",
              "targetObjectId": "clm_safety_manageable",
              "targetObjectType": "claim",
              "assumption": "Monitoring alone is a complete safety plan.",
              "text": "Monitoring without quantitative stopping rules is not a safety plan. The DSMB must have pre-specified criteria for recommending clinical hold on hepatic events. These must be finalized before first patient dosed.",
              "status": "open",
              "raisedAt": "2026-06-29T09:00:00.726Z"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:1b5798cdbf80e04b8ab1e98665b5ede2bddf8af6df3ff45eddc9d6c628ff2d14",
          "content_hash": "sha256:16c6c004a73c42245bfc63b172130adc79dab041f2f92ed4dbe67e8e590fefc2"
        },
        {
          "event_id": "evt_decisionrequestopened_drq_safety_assessment_mqyzlpra_f3f28381",
          "event_type": "DecisionRequestOpened",
          "thread_id": "thd_arm_safety_assessment_ltn4481",
          "actor_id": "par_safety_officer",
          "timestamp": "2026-06-29T09:00:00.748Z",
          "payload": {
            "decisionRequest": {
              "id": "drq_safety_assessment",
              "object": "decisionRequest",
              "threadId": "thd_arm_safety_assessment_ltn4481",
              "proposal": "Safety profile is acceptable for Phase III with DILI panel mitigation measures and hepatic stopping rules.",
              "status": "review",
              "supportingEvidenceIds": [
                "evd_integrated_safety",
                "evd_dili_panel_review",
                "evd_class_context"
              ],
              "supportingClaimIds": [
                "clm_safety_manageable"
              ],
              "supportingAssumptionIds": [
                "asm_monitoring_sufficient"
              ],
              "objectionIds": [
                "obj_arm_stopping_rules"
              ],
              "openedByParticipantId": "par_safety_officer",
              "openedAt": "2026-06-29T09:00:00.770Z"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:16c6c004a73c42245bfc63b172130adc79dab041f2f92ed4dbe67e8e590fefc2",
          "content_hash": "sha256:e807966d6b165181b5331bdab870fc19949a38879735f881115af6ecd67147ef"
        },
        {
          "event_id": "evt_reviewsubmitted_rev_dili_panel_mqyzlprw_facf8eed",
          "event_type": "ReviewSubmitted",
          "thread_id": "thd_arm_safety_assessment_ltn4481",
          "actor_id": "par_dili_panel",
          "timestamp": "2026-06-29T09:00:00.792Z",
          "payload": {
            "review": {
              "id": "rev_dili_panel",
              "object": "review",
              "threadId": "thd_arm_safety_assessment_ltn4481",
              "decisionRequestId": "drq_safety_assessment",
              "reviewerParticipantId": "par_dili_panel",
              "status": "approve_with_conditions",
              "conditions": [
                "Baseline ALT greater than 2x ULN exclusion",
                "Biweekly ALT/AST monitoring first 12 weeks",
                "Quantitative stopping rules in protocol before FPD"
              ],
              "comment": "Panel endorses advancement with mitigation.",
              "reviewedAt": "2026-06-29T09:00:00.814Z"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:e807966d6b165181b5331bdab870fc19949a38879735f881115af6ecd67147ef",
          "content_hash": "sha256:230f95c76c5d25296ddd58fcb958dc1cc7644a3683c48e2420589f2a1f76244f"
        },
        {
          "event_id": "evt_decisionmerged_dcr_safety_acceptable_mqyzlpsi_fd0bd071",
          "event_type": "DecisionMerged",
          "thread_id": "thd_arm_safety_assessment_ltn4481",
          "actor_id": "par_safety_officer",
          "timestamp": "2026-06-29T09:00:00.836Z",
          "payload": {
            "decisionRecord": {
              "id": "dcr_safety_acceptable",
              "object": "decisionRecord",
              "threadId": "thd_arm_safety_assessment_ltn4481",
              "decisionRequestId": "drq_safety_assessment",
              "status": "approved",
              "summary": "Safety profile acceptable for Phase III with three hard-gated conditions.",
              "rationale": "Two hepatotoxicity cases are concerning; neither met Hy's Law criteria and both resolved on discontinuation. DILI panel consensus supports advancement. Stopping rules objection is incorporated as a binding pre-FPD condition.",
              "conditions": [
                "Baseline ALT greater than 2x ULN exclusion criterion",
                "Biweekly ALT/AST monitoring for first 12 weeks",
                "Quantitative hepatic stopping rules finalized before first patient dosed — hard gate"
              ],
              "supportingEvidenceIds": [
                "evd_integrated_safety",
                "evd_dili_panel_review",
                "evd_class_context"
              ],
              "supportingClaimIds": [
                "clm_safety_manageable"
              ],
              "supportingAssumptionIds": [
                "asm_monitoring_sufficient"
              ],
              "objectionIds": [
                "obj_arm_stopping_rules"
              ],
              "reviewIds": [
                "rev_dili_panel"
              ],
              "authorityTrail": [
                {
                  "participantId": "par_safety_officer",
                  "role": "decision owner",
                  "source": "ParticipantAdded.role"
                }
              ],
              "preservedObjectionIds": [
                "obj_arm_stopping_rules"
              ],
              "minorityReportIds": [
                "mnr_arm_stopping_rules_gate"
              ],
              "nextAction": "Stopping rules and DSMB charter are critical path items.",
              "decidedByParticipantId": "par_safety_officer",
              "decidedAt": "2026-06-29T09:00:00.858Z",
              "contentHash": "sha256:arm_dcr_safety_acceptable"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:230f95c76c5d25296ddd58fcb958dc1cc7644a3683c48e2420589f2a1f76244f",
          "content_hash": "sha256:7db7d90f21a043a1e5a2dc5d3709620c98b776c6bf1b1e96018224910ed51eda"
        },
        {
          "event_id": "evt_minorityreportfiled_stopping_rules_mqyzlpt4_19a8e09b",
          "event_type": "MinorityReportFiled",
          "thread_id": "thd_arm_safety_assessment_ltn4481",
          "actor_id": "par_safety_officer",
          "timestamp": "2026-06-29T09:00:00.880Z",
          "payload": {
            "minorityReport": {
              "id": "mnr_arm_stopping_rules_gate",
              "object": "minorityReport",
              "threadId": "thd_arm_safety_assessment_ltn4481",
              "decisionRecordId": "dcr_safety_acceptable",
              "participantId": "par_safety_officer",
              "text": "The safety officer files this report to ensure the stopping-rules condition is treated as a hard gate. Monitoring without quantitative decision criteria is surveillance without a trigger. If enrollment begins before stopping rules are finalized, this record documents that the risk was identified and the condition was explicitly designated as non-negotiable.",
              "objectionIds": [
                "obj_arm_stopping_rules"
              ],
              "filedAt": "2026-06-29T09:00:00.902Z",
              "contentHash": "sha256:arm_mnr_stopping_rules_gate"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:7db7d90f21a043a1e5a2dc5d3709620c98b776c6bf1b1e96018224910ed51eda",
          "content_hash": "sha256:236c2a760c8db4aba8b2357452401c56001b43d62e34114d26ddae68a7e46681"
        }
      ]
    },
    {
      "role": "arm",
      "threadId": "thd_arm_subgroup_review_ltn4481",
      "events": [
        {
          "event_id": "evt_participantadded_par_biostat_mqyzlptq_5481cb46",
          "event_type": "ParticipantAdded",
          "thread_id": "thd_arm_subgroup_review_ltn4481",
          "actor_id": "par_biostat",
          "timestamp": "2026-06-29T09:00:00.924Z",
          "payload": {
            "participant": {
              "id": "par_biostat",
              "object": "participant",
              "kind": "human",
              "name": "Dr. K. Liang",
              "role": "decision owner"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "content_hash": "sha256:0b66e7ce0c00f2adee8672cff6545bdf562a66cc8332902802dddbae7c42ef34"
        },
        {
          "event_id": "evt_participantadded_par_cmo_mqyzlpuc_83d6aebd",
          "event_type": "ParticipantAdded",
          "thread_id": "thd_arm_subgroup_review_ltn4481",
          "actor_id": "par_cmo",
          "timestamp": "2026-06-29T09:00:00.946Z",
          "payload": {
            "participant": {
              "id": "par_cmo",
              "object": "participant",
              "kind": "human",
              "name": "Dr. R. Vasquez",
              "role": "clinical sponsor"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:0b66e7ce0c00f2adee8672cff6545bdf562a66cc8332902802dddbae7c42ef34",
          "content_hash": "sha256:39363d1187b4dd9bab9b9cf24c5d79524ba0c5c5960ad077279acfa81205f82a"
        },
        {
          "event_id": "evt_threadcreated_thd_arm_subgroup_review_ltn4481_mqyzlpuy_22690fa1",
          "event_type": "ThreadCreated",
          "thread_id": "thd_arm_subgroup_review_ltn4481",
          "actor_id": "par_biostat",
          "timestamp": "2026-06-29T09:00:00.968Z",
          "payload": {
            "thread": {
              "id": "thd_arm_subgroup_review_ltn4481",
              "object": "thread",
              "title": "Subgroup Analysis Review — LTN-4481 Bio-Failure Responders",
              "question": "Should the post-hoc bio-failure subgroup finding influence Phase III trial design?",
              "status": "active",
              "participantIds": [
                "par_biostat",
                "par_cmo"
              ],
              "createdAt": "2026-06-29T09:00:00.000Z",
              "updatedAt": "2026-06-29T09:00:00.000Z"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:39363d1187b4dd9bab9b9cf24c5d79524ba0c5c5960ad077279acfa81205f82a",
          "content_hash": "sha256:6476adfbda9eadc783f6daa23b133c7c484817fb745947bcf298275c963abffb"
        },
        {
          "event_id": "evt_evidencecommitted_evd_subgroup_data_mqyzlpvk_88a3128c",
          "event_type": "EvidenceCommitted",
          "thread_id": "thd_arm_subgroup_review_ltn4481",
          "actor_id": "par_biostat",
          "timestamp": "2026-06-29T09:00:00.990Z",
          "payload": {
            "evidence": {
              "id": "evd_subgroup_data",
              "object": "evidence",
              "threadId": "thd_arm_subgroup_review_ltn4481",
              "source": "Post-hoc subgroup analysis (4481-201-SGA)",
              "finding": "Bio-failure patients (n=89) showed 46.3 percent remission (95 percent CI 35.9-56.7, Wald) vs 34.1 percent in bio-naive patients (n=258). Post-hoc, not pre-specified; the treatment-by-subgroup interaction is not statistically significant and the nominal difference is unadjusted for multiplicity. Sample size inadequate for confirmatory inference.",
              "confidence": 0.62,
              "committedByParticipantId": "par_biostat",
              "committedAt": "2026-06-29T09:00:00.990Z",
              "artifactIds": [],
              "contentHash": "sha256:arm_evd_subgroup_data"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:6476adfbda9eadc783f6daa23b133c7c484817fb745947bcf298275c963abffb",
          "content_hash": "sha256:e60539ebe8955c0924b73c05465e90b7c26d929e9b79687567e5dc79b3dc0ad2"
        },
        {
          "event_id": "evt_evidencecommitted_evd_fda_subgroup_guidance_mqyzlpw6_02062690",
          "event_type": "EvidenceCommitted",
          "thread_id": "thd_arm_subgroup_review_ltn4481",
          "actor_id": "par_biostat",
          "timestamp": "2026-06-29T09:00:01.012Z",
          "payload": {
            "evidence": {
              "id": "evd_fda_subgroup_guidance",
              "object": "evidence",
              "threadId": "thd_arm_subgroup_review_ltn4481",
              "source": "FDA guidance on subgroup analyses in clinical trials (2023)",
              "finding": "FDA expects subgroup analyses to be pre-specified in the SAP. Post-hoc findings may be hypothesis-generating but should not drive primary endpoint strategy or enrichment without independent confirmation.",
              "confidence": 0.93,
              "committedByParticipantId": "par_biostat",
              "committedAt": "2026-06-29T09:00:01.012Z",
              "artifactIds": [],
              "contentHash": "sha256:arm_evd_fda_subgroup_guidance"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:e60539ebe8955c0924b73c05465e90b7c26d929e9b79687567e5dc79b3dc0ad2",
          "content_hash": "sha256:0516e5930a976c592ba169aff8464431051cbfd25882b1dae4977c3256a8ced8"
        },
        {
          "event_id": "evt_assumptiondeclared_asm_subgroup_exploratory_only_mqyzlpws_a43c19d0",
          "event_type": "AssumptionDeclared",
          "thread_id": "thd_arm_subgroup_review_ltn4481",
          "actor_id": "par_biostat",
          "timestamp": "2026-06-29T09:00:01.034Z",
          "payload": {
            "assumption": {
              "id": "asm_subgroup_exploratory_only",
              "object": "assumption",
              "threadId": "thd_arm_subgroup_review_ltn4481",
              "text": "The bio-failure subgroup finding is hypothesis-generating only and should not drive Phase III enrichment, stratification, or primary endpoint strategy.",
              "status": "active",
              "evidenceIds": [
                "evd_subgroup_data",
                "evd_fda_subgroup_guidance"
              ],
              "confidence": 0.72,
              "declaredByParticipantId": "par_biostat",
              "declaredAt": "2026-06-29T09:00:01.034Z",
              "contentHash": "sha256:arm_asm_subgroup_exploratory_only"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:0516e5930a976c592ba169aff8464431051cbfd25882b1dae4977c3256a8ced8",
          "content_hash": "sha256:e77b86c1619f1c87caf4c4ce0a40bfb24a13dfa01f73e895078c4ac0b5672d03"
        },
        {
          "event_id": "evt_claimcreated_clm_no_subgroup_design_influence_mqyzlpxe_42ad3d7d",
          "event_type": "ClaimCreated",
          "thread_id": "thd_arm_subgroup_review_ltn4481",
          "actor_id": "par_biostat",
          "timestamp": "2026-06-29T09:00:01.056Z",
          "payload": {
            "claim": {
              "id": "clm_no_subgroup_design_influence",
              "object": "claim",
              "threadId": "thd_arm_subgroup_review_ltn4481",
              "text": "Phase III design must not incorporate the post-hoc bio-failure finding as anything other than an exploratory objective with no alpha allocation.",
              "status": "endorsed",
              "evidenceIds": [
                "evd_subgroup_data",
                "evd_fda_subgroup_guidance"
              ],
              "assumptionIds": [
                "asm_subgroup_exploratory_only"
              ],
              "contradictingEvidenceIds": [],
              "createdByParticipantId": "par_biostat",
              "createdAt": "2026-06-29T09:00:01.078Z"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:e77b86c1619f1c87caf4c4ce0a40bfb24a13dfa01f73e895078c4ac0b5672d03",
          "content_hash": "sha256:59818e3d222785280cc72663543c405ff7ab79e1215a897676ccbafee0f39006"
        },
        {
          "event_id": "evt_positiontaken_par_biostat_mqyzlpy0_04c7e8db",
          "event_type": "PositionTaken",
          "thread_id": "thd_arm_subgroup_review_ltn4481",
          "actor_id": "par_biostat",
          "timestamp": "2026-06-29T09:00:01.100Z",
          "payload": {
            "position": {
              "id": "pos_biostat_support",
              "object": "position",
              "threadId": "thd_arm_subgroup_review_ltn4481",
              "participantId": "par_biostat",
              "targetObjectId": "clm_no_subgroup_design_influence",
              "targetObjectType": "claim",
              "stance": "support",
              "reason": "Statistical integrity of the Phase III pivotal trial depends on this discipline.",
              "takenAt": "2026-06-29T09:00:01.122Z"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:59818e3d222785280cc72663543c405ff7ab79e1215a897676ccbafee0f39006",
          "content_hash": "sha256:ccd0e5d059ba556d9818b940b52c3044604051266f31cd22937f25fba564fd91"
        },
        {
          "event_id": "evt_positiontaken_par_cmo_mqyzlpym_ba02c28a",
          "event_type": "PositionTaken",
          "thread_id": "thd_arm_subgroup_review_ltn4481",
          "actor_id": "par_cmo",
          "timestamp": "2026-06-29T09:00:01.144Z",
          "payload": {
            "position": {
              "id": "pos_cmo_support",
              "object": "position",
              "threadId": "thd_arm_subgroup_review_ltn4481",
              "participantId": "par_cmo",
              "targetObjectId": "clm_no_subgroup_design_influence",
              "targetObjectType": "claim",
              "stance": "support",
              "reason": "Agree the finding is interesting but premature for design-level decisions.",
              "takenAt": "2026-06-29T09:00:01.166Z"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:ccd0e5d059ba556d9818b940b52c3044604051266f31cd22937f25fba564fd91",
          "content_hash": "sha256:069e8e2d5ea45c751e4ffddede3508f243e42f66111e7fa0b73347723464523b"
        },
        {
          "event_id": "evt_decisionrequestopened_drq_subgroup_designation_mqyzlpz8_42489972",
          "event_type": "DecisionRequestOpened",
          "thread_id": "thd_arm_subgroup_review_ltn4481",
          "actor_id": "par_biostat",
          "timestamp": "2026-06-29T09:00:01.188Z",
          "payload": {
            "decisionRequest": {
              "id": "drq_subgroup_designation",
              "object": "decisionRequest",
              "threadId": "thd_arm_subgroup_review_ltn4481",
              "proposal": "Designate bio-failure subgroup as exploratory only in Phase III.",
              "status": "review",
              "supportingEvidenceIds": [
                "evd_subgroup_data",
                "evd_fda_subgroup_guidance"
              ],
              "supportingClaimIds": [
                "clm_no_subgroup_design_influence"
              ],
              "supportingAssumptionIds": [
                "asm_subgroup_exploratory_only"
              ],
              "objectionIds": [],
              "openedByParticipantId": "par_biostat",
              "openedAt": "2026-06-29T09:00:01.210Z"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:069e8e2d5ea45c751e4ffddede3508f243e42f66111e7fa0b73347723464523b",
          "content_hash": "sha256:89886626ca678c5d020bca7171c431c79892fc6eaad671fa88cda52ecc75f389"
        },
        {
          "event_id": "evt_reviewsubmitted_rev_cmo_subgroup_mqyzlpzu_136e80ea",
          "event_type": "ReviewSubmitted",
          "thread_id": "thd_arm_subgroup_review_ltn4481",
          "actor_id": "par_cmo",
          "timestamp": "2026-06-29T09:00:01.232Z",
          "payload": {
            "review": {
              "id": "rev_cmo_subgroup",
              "object": "review",
              "threadId": "thd_arm_subgroup_review_ltn4481",
              "decisionRequestId": "drq_subgroup_designation",
              "reviewerParticipantId": "par_cmo",
              "status": "approve",
              "conditions": [],
              "comment": "Agreed. Exploratory only.",
              "reviewedAt": "2026-06-29T09:00:01.254Z"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:89886626ca678c5d020bca7171c431c79892fc6eaad671fa88cda52ecc75f389",
          "content_hash": "sha256:3659364de23810ad35cbddab89ae869850c3f73a35f6f3e132e8632540e98ba2"
        },
        {
          "event_id": "evt_decisionmerged_dcr_subgroup_exploratory_mqyzlq0g_50d07910",
          "event_type": "DecisionMerged",
          "thread_id": "thd_arm_subgroup_review_ltn4481",
          "actor_id": "par_biostat",
          "timestamp": "2026-06-29T09:00:01.276Z",
          "payload": {
            "decisionRecord": {
              "id": "dcr_subgroup_exploratory",
              "object": "decisionRecord",
              "threadId": "thd_arm_subgroup_review_ltn4481",
              "decisionRequestId": "drq_subgroup_designation",
              "status": "approved",
              "summary": "Bio-failure subgroup designated exploratory only. No alpha allocation, no enrichment, no stratification in Phase III primary analysis.",
              "rationale": "Post-hoc finding with wide CI on 89 patients does not meet the evidentiary bar for design-level influence. FDA guidance reinforces this.",
              "conditions": [
                "No alpha allocation to bio-failure subgroup analysis",
                "No enrichment or stratification based on prior biologic exposure",
                "Subgroup analysis isolated as exploratory objective in SAP"
              ],
              "supportingEvidenceIds": [
                "evd_subgroup_data",
                "evd_fda_subgroup_guidance"
              ],
              "supportingClaimIds": [
                "clm_no_subgroup_design_influence"
              ],
              "supportingAssumptionIds": [
                "asm_subgroup_exploratory_only"
              ],
              "objectionIds": [],
              "reviewIds": [
                "rev_cmo_subgroup"
              ],
              "authorityTrail": [
                {
                  "participantId": "par_biostat",
                  "role": "decision owner",
                  "source": "ParticipantAdded.role"
                }
              ],
              "preservedObjectionIds": [],
              "minorityReportIds": [],
              "nextAction": "Encode exploratory designation in SAP. Monitor for internal pressure to promote.",
              "decidedByParticipantId": "par_biostat",
              "decidedAt": "2026-06-29T09:00:01.298Z",
              "contentHash": "sha256:arm_dcr_subgroup_exploratory"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:3659364de23810ad35cbddab89ae869850c3f73a35f6f3e132e8632540e98ba2",
          "content_hash": "sha256:a5f9103437abca655d87f3b55d9c772c37356241155c7466cb20be02139adf47"
        },
        {
          "event_id": "evt_minorityreportfiled_subgroup_discipline_mqyzlq12_130ead46",
          "event_type": "MinorityReportFiled",
          "thread_id": "thd_arm_subgroup_review_ltn4481",
          "actor_id": "par_biostat",
          "timestamp": "2026-06-29T09:00:01.320Z",
          "payload": {
            "minorityReport": {
              "id": "mnr_arm_subgroup_discipline",
              "object": "minorityReport",
              "threadId": "thd_arm_subgroup_review_ltn4481",
              "decisionRecordId": "dcr_subgroup_exploratory",
              "participantId": "par_biostat",
              "text": "This minority report is filed proactively for the trial master file. The bio-failure subgroup finding (46.3 percent remission, n=89, 95 percent CI 35.9-56.7) will generate organizational pressure to promote it from exploratory to confirmatory — as enrichment, stratification, or a co-primary endpoint. Any such promotion would compromise the statistical integrity of the Phase III trial and create regulatory risk. This dissent is recorded at the arm-level decision so that if a future protocol amendment attempts to change the subgroup designation, there is a traceable record that the lead biostatistician objected at the earliest decision point.",
              "objectionIds": [],
              "filedAt": "2026-06-29T09:00:01.342Z",
              "contentHash": "sha256:arm_mnr_subgroup_discipline"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:a5f9103437abca655d87f3b55d9c772c37356241155c7466cb20be02139adf47",
          "content_hash": "sha256:f1d575bba0c5fc0f4678d21a04bde9a4f9364c8ecb437ccabff06888e5e3933d"
        }
      ]
    },
    {
      "role": "arm",
      "threadId": "thd_arm_regulatory_strategy_ltn4481",
      "events": [
        {
          "event_id": "evt_participantadded_par_reg_affairs_mqyzlq1o_477fedd9",
          "event_type": "ParticipantAdded",
          "thread_id": "thd_arm_regulatory_strategy_ltn4481",
          "actor_id": "par_reg_affairs",
          "timestamp": "2026-06-29T09:00:01.364Z",
          "payload": {
            "participant": {
              "id": "par_reg_affairs",
              "object": "participant",
              "kind": "human",
              "name": "J. Markova",
              "role": "decision owner"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "content_hash": "sha256:53c363f4b51093892e3c814ced279dcf95094c586cce8604739648787fc28168"
        },
        {
          "event_id": "evt_participantadded_par_reg_writer_mqyzlq2a_30922676",
          "event_type": "ParticipantAdded",
          "thread_id": "thd_arm_regulatory_strategy_ltn4481",
          "actor_id": "par_reg_writer",
          "timestamp": "2026-06-29T09:00:01.386Z",
          "payload": {
            "participant": {
              "id": "par_reg_writer",
              "object": "participant",
              "kind": "human",
              "name": "M. Torres",
              "role": "regulatory writer"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:53c363f4b51093892e3c814ced279dcf95094c586cce8604739648787fc28168",
          "content_hash": "sha256:dd4ab97232ee36cf0bfcd8cbe5d320ead33c575fbd523ab6053313adf07416df"
        },
        {
          "event_id": "evt_threadcreated_thd_arm_regulatory_strategy_ltn4481_mqyzlq2w_e7519f42",
          "event_type": "ThreadCreated",
          "thread_id": "thd_arm_regulatory_strategy_ltn4481",
          "actor_id": "par_reg_affairs",
          "timestamp": "2026-06-29T09:00:01.408Z",
          "payload": {
            "thread": {
              "id": "thd_arm_regulatory_strategy_ltn4481",
              "object": "thread",
              "title": "Regulatory Strategy — LTN-4481 Phase III Path",
              "question": "What is the viable regulatory path for LTN-4481 Phase III?",
              "status": "active",
              "participantIds": [
                "par_reg_affairs",
                "par_reg_writer"
              ],
              "createdAt": "2026-06-29T09:00:00.000Z",
              "updatedAt": "2026-06-29T09:00:00.000Z"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:dd4ab97232ee36cf0bfcd8cbe5d320ead33c575fbd523ab6053313adf07416df",
          "content_hash": "sha256:ff91e0361bf6bd39f2623606e7ac9f914d1e4ea5ee06ab9144a69f8c90cc3fd2"
        },
        {
          "event_id": "evt_evidencecommitted_evd_type_b_minutes_mqyzlq3i_59ee1bbb",
          "event_type": "EvidenceCommitted",
          "thread_id": "thd_arm_regulatory_strategy_ltn4481",
          "actor_id": "par_reg_affairs",
          "timestamp": "2026-06-29T09:00:01.430Z",
          "payload": {
            "evidence": {
              "id": "evd_type_b_minutes",
              "object": "evidence",
              "threadId": "thd_arm_regulatory_strategy_ltn4481",
              "source": "FDA Type B End-of-Phase-2 meeting minutes (2026-02-14)",
              "finding": "FDA agreed 200mg Q4W reasonable. A single pivotal trial is acceptable as a treat-through study covering both induction and maintenance, at least 500 patients, with pre-specified interim futility — provided the induction study serves as the confirmatory source. Hepatic monitoring plan and stopping rules required.",
              "confidence": 0.95,
              "committedByParticipantId": "par_reg_affairs",
              "committedAt": "2026-06-29T09:00:01.430Z",
              "artifactIds": [],
              "contentHash": "sha256:arm_evd_type_b_minutes"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:ff91e0361bf6bd39f2623606e7ac9f914d1e4ea5ee06ab9144a69f8c90cc3fd2",
          "content_hash": "sha256:0f820e5c9d566f7bb056afcbe74c46412826c89ff295a1bc3d7e1f4bf6df417c"
        },
        {
          "event_id": "evt_evidencecommitted_evd_competitive_landscape_mqyzlq44_7c0c65de",
          "event_type": "EvidenceCommitted",
          "thread_id": "thd_arm_regulatory_strategy_ltn4481",
          "actor_id": "par_reg_writer",
          "timestamp": "2026-06-29T09:00:01.452Z",
          "payload": {
            "evidence": {
              "id": "evd_competitive_landscape",
              "object": "evidence",
              "threadId": "thd_arm_regulatory_strategy_ltn4481",
              "source": "Competitive landscape memo (2026-05-22)",
              "finding": "Three JAK inhibitors and two IL-23 inhibitors approved for UC. FDA heightened scrutiny on hepatotoxicity. Bio-failure enrichment viewed favorably if supported by pre-specified analysis.",
              "confidence": 0.86,
              "committedByParticipantId": "par_reg_writer",
              "committedAt": "2026-06-29T09:00:01.452Z",
              "artifactIds": [],
              "contentHash": "sha256:arm_evd_competitive_landscape"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:0f820e5c9d566f7bb056afcbe74c46412826c89ff295a1bc3d7e1f4bf6df417c",
          "content_hash": "sha256:6f609f42dc3d77767bb265dd11e0458505efbdefc74113a11112120530ac8405"
        },
        {
          "event_id": "evt_assumptiondeclared_asm_fda_alignment_holds_mqyzlq4q_1824cd09",
          "event_type": "AssumptionDeclared",
          "thread_id": "thd_arm_regulatory_strategy_ltn4481",
          "actor_id": "par_reg_affairs",
          "timestamp": "2026-06-29T09:00:01.474Z",
          "payload": {
            "assumption": {
              "id": "asm_fda_alignment_holds",
              "object": "assumption",
              "threadId": "thd_arm_regulatory_strategy_ltn4481",
              "text": "FDA Type B meeting agreements will hold through IND amendment review. No material change in FDA regulatory posture on UC drugs is expected.",
              "status": "active",
              "evidenceIds": [
                "evd_type_b_minutes"
              ],
              "confidence": 0.88,
              "declaredByParticipantId": "par_reg_affairs",
              "declaredAt": "2026-06-29T09:00:01.474Z",
              "contentHash": "sha256:arm_asm_fda_alignment_holds"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:6f609f42dc3d77767bb265dd11e0458505efbdefc74113a11112120530ac8405",
          "content_hash": "sha256:a92321a88c847d12695d255b4e49108de2950aee3bf59deca77ea259839db26d"
        },
        {
          "event_id": "evt_claimcreated_clm_single_pivotal_viable_mqyzlq5c_957b78ff",
          "event_type": "ClaimCreated",
          "thread_id": "thd_arm_regulatory_strategy_ltn4481",
          "actor_id": "par_reg_affairs",
          "timestamp": "2026-06-29T09:00:01.496Z",
          "payload": {
            "claim": {
              "id": "clm_single_pivotal_viable",
              "object": "claim",
              "threadId": "thd_arm_regulatory_strategy_ltn4481",
              "text": "Single pivotal trial strategy is viable as a treat-through study covering induction and maintenance, with adaptive design, interim futility, and hepatic monitoring per FDA feedback; the induction phase supplies the confirmatory evidence the single-pivotal path requires.",
              "status": "endorsed",
              "evidenceIds": [
                "evd_type_b_minutes",
                "evd_competitive_landscape"
              ],
              "assumptionIds": [
                "asm_fda_alignment_holds"
              ],
              "contradictingEvidenceIds": [],
              "createdByParticipantId": "par_reg_affairs",
              "createdAt": "2026-06-29T09:00:01.518Z"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:a92321a88c847d12695d255b4e49108de2950aee3bf59deca77ea259839db26d",
          "content_hash": "sha256:8c5e7628ef6f283d45c45f18556feed0048c393846ec1fc3c845bd0f4c4bc6d7"
        },
        {
          "event_id": "evt_positiontaken_par_reg_affairs_mqyzlq5y_118ac9de",
          "event_type": "PositionTaken",
          "thread_id": "thd_arm_regulatory_strategy_ltn4481",
          "actor_id": "par_reg_affairs",
          "timestamp": "2026-06-29T09:00:01.540Z",
          "payload": {
            "position": {
              "id": "pos_reg_affairs_support",
              "object": "position",
              "threadId": "thd_arm_regulatory_strategy_ltn4481",
              "participantId": "par_reg_affairs",
              "targetObjectId": "clm_single_pivotal_viable",
              "targetObjectType": "claim",
              "stance": "support",
              "reason": "FDA alignment de-risks the regulatory path substantially.",
              "takenAt": "2026-06-29T09:00:01.562Z"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:8c5e7628ef6f283d45c45f18556feed0048c393846ec1fc3c845bd0f4c4bc6d7",
          "content_hash": "sha256:b11717e74306555f599cf4bd1127e95818f1f78523c096f88b9b27f92193ee9d"
        },
        {
          "event_id": "evt_positiontaken_par_reg_writer_mqyzlq6k_5e6547db",
          "event_type": "PositionTaken",
          "thread_id": "thd_arm_regulatory_strategy_ltn4481",
          "actor_id": "par_reg_writer",
          "timestamp": "2026-06-29T09:00:01.584Z",
          "payload": {
            "position": {
              "id": "pos_reg_writer_support",
              "object": "position",
              "threadId": "thd_arm_regulatory_strategy_ltn4481",
              "participantId": "par_reg_writer",
              "targetObjectId": "clm_single_pivotal_viable",
              "targetObjectType": "claim",
              "stance": "support",
              "reason": "Meeting minutes provide clear design guidance.",
              "takenAt": "2026-06-29T09:00:01.606Z"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:b11717e74306555f599cf4bd1127e95818f1f78523c096f88b9b27f92193ee9d",
          "content_hash": "sha256:8599b352ba1940abb9168a5b73deadabc2965de2cbafb7d75ce11162e390f295"
        },
        {
          "event_id": "evt_decisionrequestopened_drq_reg_strategy_mqyzlq76_81809a81",
          "event_type": "DecisionRequestOpened",
          "thread_id": "thd_arm_regulatory_strategy_ltn4481",
          "actor_id": "par_reg_affairs",
          "timestamp": "2026-06-29T09:00:01.628Z",
          "payload": {
            "decisionRequest": {
              "id": "drq_reg_strategy",
              "object": "decisionRequest",
              "threadId": "thd_arm_regulatory_strategy_ltn4481",
              "proposal": "Pursue single pivotal trial with adaptive design per FDA Type B alignment.",
              "status": "review",
              "supportingEvidenceIds": [
                "evd_type_b_minutes",
                "evd_competitive_landscape"
              ],
              "supportingClaimIds": [
                "clm_single_pivotal_viable"
              ],
              "supportingAssumptionIds": [],
              "objectionIds": [],
              "openedByParticipantId": "par_reg_affairs",
              "openedAt": "2026-06-29T09:00:01.650Z"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:8599b352ba1940abb9168a5b73deadabc2965de2cbafb7d75ce11162e390f295",
          "content_hash": "sha256:8b58c70cf888b2d34a19d48eef60566c7f2de594c2db589a46884bb1cdf0e0e0"
        },
        {
          "event_id": "evt_reviewsubmitted_rev_reg_writer_mqyzlq7s_49e731d5",
          "event_type": "ReviewSubmitted",
          "thread_id": "thd_arm_regulatory_strategy_ltn4481",
          "actor_id": "par_reg_writer",
          "timestamp": "2026-06-29T09:00:01.672Z",
          "payload": {
            "review": {
              "id": "rev_reg_writer",
              "object": "review",
              "threadId": "thd_arm_regulatory_strategy_ltn4481",
              "decisionRequestId": "drq_reg_strategy",
              "reviewerParticipantId": "par_reg_writer",
              "status": "approve",
              "conditions": [],
              "comment": "Path is clear. IND amendment can reference meeting minutes directly.",
              "reviewedAt": "2026-06-29T09:00:01.694Z"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:8b58c70cf888b2d34a19d48eef60566c7f2de594c2db589a46884bb1cdf0e0e0",
          "content_hash": "sha256:9bc211eabff4f992f2bd5e1b31b72531e428501b7b04b370d8a2090b76a85b12"
        },
        {
          "event_id": "evt_decisionmerged_dcr_reg_strategy_confirmed_mqyzlq8e_cb76c431",
          "event_type": "DecisionMerged",
          "thread_id": "thd_arm_regulatory_strategy_ltn4481",
          "actor_id": "par_reg_affairs",
          "timestamp": "2026-06-29T09:00:01.716Z",
          "payload": {
            "decisionRecord": {
              "id": "dcr_reg_strategy_confirmed",
              "object": "decisionRecord",
              "threadId": "thd_arm_regulatory_strategy_ltn4481",
              "decisionRequestId": "drq_reg_strategy",
              "status": "approved",
              "summary": "Single pivotal trial strategy confirmed. Adaptive design with interim futility, at least 500 patients, hepatic monitoring plan.",
              "rationale": "FDA alignment on dose, design, and monitoring requirements provides a clear regulatory path. IND amendment should reference Type B meeting minutes.",
              "conditions": [
                "Minimum 500 patients",
                "Pre-specified interim futility analysis",
                "Hepatic monitoring plan per FDA feedback",
                "IND amendment references Type B meeting agreement"
              ],
              "supportingEvidenceIds": [
                "evd_type_b_minutes",
                "evd_competitive_landscape"
              ],
              "supportingClaimIds": [
                "clm_single_pivotal_viable"
              ],
              "supportingAssumptionIds": [
                "asm_fda_alignment_holds"
              ],
              "objectionIds": [],
              "reviewIds": [
                "rev_reg_writer"
              ],
              "authorityTrail": [
                {
                  "participantId": "par_reg_affairs",
                  "role": "decision owner",
                  "source": "ParticipantAdded.role"
                }
              ],
              "preservedObjectionIds": [],
              "minorityReportIds": [],
              "nextAction": "Draft IND amendment incorporating FDA meeting agreements.",
              "decidedByParticipantId": "par_reg_affairs",
              "decidedAt": "2026-06-29T09:00:01.738Z",
              "contentHash": "sha256:arm_dcr_reg_strategy_confirmed"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:9bc211eabff4f992f2bd5e1b31b72531e428501b7b04b370d8a2090b76a85b12",
          "content_hash": "sha256:e6466f7151fc97f0e03616a746626bb4bbc10d55e966a988a642e2b52b93d9ae"
        }
      ]
    }
  ]
};
