## 实践环境

-   Kubernetes: 1.25
-   colima: 0.5.4

```shell
# 设置启动 docker,设置 docker 可以用到的内存
colima start --kubernetes --kubernetes-version 'v1.25.0+k3s1'
```

## Kubectl

```shell
# 等待 deployment 部署好
kubectl rollout status deployment nginx-deployment
# 重新部署 deployment
kubectl rollout restart deployment nginx-deployment
```

## Docker

```shell
echo $PAT | docker login ghcr.io/zhangpanqin -u USERNAME --password-stdin
docker pull gcr.io/google_containers/busybox
docker tag gcr.io/google_containers/busybox:latest ghcr.io/zhangpanqin/busybox:0.0.1
```

## Kubernetes Arch

![k8s_arch](./README.assets/k8s_arch.png)

在 Kubernetes 集群中需要一个 Master 节点来负责整个集群 的管理和控制，所有的控制命令都发给 Master 节点上的组件。

Master 通常会占据一个独立服务器（部署三台保证高可用）。

### Master 节点

Master 节点上运行以下关键进程：

-   kube-apiserver：提供了 Restful 接口对 Kubernetes 里所有的资源进行 crud。也实现了认证、授权、准入控制等安全校验功能，同时也负责集群状态的存储操作（通过 etcd）
-   kube-controller-manager：负责维护集群的状态，比如故障检测、自动扩展、滚动更新等。每个资源一般都对应有一个 controller，这些 controller 通过 api server 实时监控各个资源的状态，controller manager 就是负责管理这些 controller 的。
-   kube-scheduler：负责资源的调度，比如 Pod 改分配那个节点。

### Node 节点

kubelet，负责 Pod 对应的容器的创建，启停等任务，同时与 Master 密切协作，实现集群的管理功能。kubelet 定时向 Master 汇报自身的情报，操作系统，机器的 cpu 和 memory，以及运行哪些 pod。

Kube-proxy，实现 k8s 的通信与负载均衡机制的重要组件。

### etcd

一致且高度可用的键值存储，用作 Kubernetes 的所有集群数据的后台数据库。

### kube-apiserver

apiserver 设计上考虑了水平扩容，你可以运行多个示例来负载均衡处理请求。

apiserver 提供了 Restful 接口对 Kubernetes 里所有的资源进行 crud。

apiserver 也实现了认证、授权、准入控制等安全校验功能，同时也负责集群状态的存储操作（通过 etcd）

apiserver 运行在集群的 master 节点上。

![api_server](./README.assets/api_server.png)

### controller-manager

Controller Manager 由 kube-controller-manager 和 cloud-controller-manager 组成，是 Kubernetes 的大脑，它通过 apiserver 监控整个集群的状态，并确保集群处于预期的工作状态。

kube-controller-manager 由一系列的控制器组成，比如：

-   NamespaceController
-   DeploymentController
-   PodGCController
-   ResourceQuotaController
-   ReplicaSetController
-   HPAController
-   ServiceAccountController
-   GarbageCollectorController
-   DaemonSetController

### scheduler

Scheduler 负责 Pod 调度，接收 Controller Manager 创建的 Pod，为其选择一个合适的 Node。Node 上的 kubelet 接管 Pod 的生命周期。

## Node

与 Master 节点一样，Node 可以是一台物理主机，也可以是一台虚拟机。当 Node 宕机时，其上的工作负载会被 Master 自动转移到其他节点。

在每个 Node 节点上都运行以下进程：

-   kubelet: 负责 Pod 对应的容器的创建、启停等任务。kubelet 进程会在 apiserver 上注册所在 Node 节点的信息，定期向 Master 节点汇报该节点的资源使用情况。
-   kube-proxy: 监听 apiserver 中 service 和 endpoint 的变化情况，并通过 iptables (推荐的代理模式) 等来为 Service 配置负载均衡（仅支持 TCP 和 UDP），使发往 Service 的流量（通过 ClusterIP 和端口）负载均衡到正确的 Pod。

Container Runtime 负责真正管理镜像和容器的生命周期。kubelet 通过 Container Runtime Interface ( CRI ) 与 Container Runtime 交互，以管理镜像和容器。

## Pod

`Pod` 是一组紧密关联的容器集合，它们共享 PID、IPC、Network 和 UTS namespace，是 Kubernetes 调度的基本单位。Pod 内的多个容器共享网络和文件系统，可以通过进程间通信和文件共享这种简单高效的方式组合完成服务。

## HPA

Horizontal Pod Autoscaling (HPA) 可以根据 CPU 使用率或应用自定义 metrics 自动扩展 Pod 数量（支持 replication controller、deployment 和 replica set ）。

<font color=red>**注意：**</font>

-   本章是关于 Pod 的自动扩展，而 Node 的自动扩展请参考 [Cluster AutoScaler](https://feisky.gitbooks.io/kubernetes/content/addons/cluster-autoscaler.html)。
-   在使用 HPA 之前需要 <font color=red>**确保已部署好**</font> [metrics-server](https://github.com/kubernetes-sigs/metrics-server)

## ConfigMap

使用场景：

1. 生成为容器内的环境变量。
2. 设置容器启动命令的启动参数（需设置为环境变量）。
3. 以 Volume 的形式挂载为容器内部的文件或目录。

使用 ConfigMap 的限制条件

-   ConfigMap 必须在 Pod 之前创建
-   ConfigMap 也可以定义为属于某个 Namespace。只有处于相同 Namespace 中的 Pod 可以引用它。
-   kubelet 只支持可以被 API Server 管理的 Pod 使用 ConfigMap。静态 Pod 无法引用。
-   在 Pod 对 ConfigMap 进行挂载操作时，容器内只能挂载为“目录”，无法挂载为文件。

```shell
# 注入环境变量和配置文件
kubectl apply -f https://raw.githubusercontent.com/zhangpanqin/fly-k8s/main/resource/base_config_map.yaml

kubectl exec -it pod/busybox -n fly-k8s -- /bin/sh
echo $FLY_NAME
cat /config/application.yaml
cat /config/game.properties
```

## Secret

### docker registry secret

```shell
kubectl create secret docker-registry regcred \
    --docker-server=ghcr.io/zhangpanqin \
    --docker-username=USERNAME --docker-password=${PAT} \
    -n fly-k8s
```

## ServiceAccount

设置使用 service account 的 token 访问资源

```shell
export K8S_NAMESPACE='nginx'
export SERVICE_ACCOUNT_NAME='nginx'
# 获取 secret 的名称
export SECRET_NAME=$(kubectl -n ${K8S_NAMESPACE} get serviceaccount/${SERVICE_ACCOUNT_NAME} -o jsonpath='{.secrets[0].name}')
# 读取 token
export TOKEN=$(kubectl -n ${K8S_NAMESPACE} get secret ${SECRET_NAME} -o jsonpath='{.data.token}' | base64 --decode)
# 配置 service account token
kubectl config set-credentials ${SERVICE_ACCOUNT_NAME} --token=${TOKEN}
# 设置当前 context 使用这个 service account
kubectl config set-context --current --user=${SERVICE_ACCOUNT_NAME}
```

## kubectl command

```shell
# 查看日志，klf1m -l 将多 container 根据 label 汇聚到一起,全称： kubectl logs --since 1m -f
klf1m -l app.kubernetes.io/name=terraform

# 重启应用
kubectl rollout restart deployment nginx -n nginx

# 更新应用
kubectl patch workspaces.app.terraform.io my-team --type='merge' \
-p '{"spec": {"secretsMountPath": "/tmp/secrets/sandbox"}}'

k get workspaces.app.terraform.io | awk '{if (NR >= 2) print $1}' | xargs -I {} \
kubectl patch workspaces.app.terraform.io {} --type='merge' \
-p '{"spec": {"secretsMountPath": "/tmp/secrets/sandbox"}}'
```
